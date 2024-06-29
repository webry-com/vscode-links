import * as vscode from "vscode";
import { convertToFileUrl, getWorkspaceConfig } from "./config";
import path from "path";
import { minimatch } from "minimatch";
import { z } from "zod";

export class LinkDefinitionProvider implements vscode.DocumentLinkProvider {
  constructor() {}

  public provideDocumentLinks(document: vscode.TextDocument): vscode.ProviderResult<vscode.DocumentLink[]> {
    const workspace = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspace) {
      return null;
    }

    const basePath = workspace.uri.fsPath;
    const config = getWorkspaceConfig(basePath);
    if (config == null) {
      return null;
    }

    const links = [] as vscode.DocumentLink[];
    for (const link of config.links) {
      const include = typeof link.include === "string" ? [link.include] : link.include;
      const exclude = typeof link.exclude === "string" ? [link.exclude] : link.exclude;
      const relativePath = path.relative(basePath, document.uri.fsPath).replace(/\\/g, "/");
      const isIncluded = include.length && include.some((pattern) => minimatch(relativePath, pattern));
      const isExcluded = exclude && exclude.length && exclude.some((pattern) => minimatch(relativePath, pattern));
      if (!isIncluded || isExcluded) {
        continue;
      }

      if ("pattern" in link) {
        const regExs = link.pattern instanceof RegExp ? [link.pattern] : link.pattern;
        if (!regExs || regExs.length === 0) {
          continue;
        }

        const text = document.getText();
        for (const regEx of regExs) {
          let match: RegExpExecArray | null;
          while ((match = regEx.exec(text))) {
            const range = {
              start: document.positionAt(match.index),
              end: document.positionAt(match.index + match[0].length),
            };

            if (match.groups && "link" in match.groups) {
              const linkText = match.groups.link;
              range.start = document.positionAt(match.index + match[0].indexOf(linkText));
              range.end = document.positionAt(match.index + match[0].indexOf(linkText) + linkText.length);
            }

            const vscRange = new vscode.Range(range.start, range.end);
            const linkText = document.getText(vscRange);
            const handleReturnSchema = z.object({
              target: z.string(),
              tooltip: z.string().optional(),
            });
            const result = link.handle({
              linkText,
              filePath: document.uri.path,
              workspacePath: workspace.uri.path,
              workspaceFile: (path: string) => {
                return `file://${workspace.uri.path}/${path}`.replace(/\\/g, "/");
              },
              file: (path: string) => {
                return `file://${path}`.replace(/\\/g, "/");
              },
            });
            const parsedResult = handleReturnSchema.safeParse(result);
            if (!parsedResult.success) {
              vscode.window.showWarningMessage(
                "VSCode Links: The link handler function must return an object with a target."
              );
              return;
            }

            const { target, tooltip } = parsedResult.data;
            links.push({
              range: vscRange,
              target: vscode.Uri.parse(target ?? ""),
              tooltip: tooltip ?? ""
            });
          }
        }
      }
    }
    return links;
  }
}
