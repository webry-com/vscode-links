import * as vscode from "vscode";
import { LinkDefinitionProvider } from "./linkDefinitionProvider";
import { getWorkspaceConfig, setupConfigWatcher } from "./config";

/**
 * TODO: Custom search function
 */

let isActivated = false;

export function activate(context: vscode.ExtensionContext) {
    activateExtension(context);

    const disposable = vscode.commands.registerCommand(
        "vscode-links.activate",
        async () => {
            if (!isActivated) {
                await activateExtension(context);
            } else {
                vscode.window.showInformationMessage(
                    "Extension is already active."
                );
            }
        }
    );

    context.subscriptions.push(disposable);
}

async function activateExtension(context: vscode.ExtensionContext) {
    await setupConfigWatcher(context);

    for (const folder of vscode.workspace.workspaceFolders ?? []) {
        const config = getWorkspaceConfig(folder.uri.fsPath);
        if (config === null) {
            continue;
        }

        const options: {
            pattern?: string;
            language?: string;
        } = {};

        options.pattern = `**/*`;

        vscode.languages.registerDocumentLinkProvider(
            options,
            new LinkDefinitionProvider()
        );
    }

    isActivated = true;
}

export function deactivate() {}
