import * as vscode from "vscode"
import { LinkDefinitionProvider } from "../LinkDefinitionProvider"

const linkProviders: Map<
  LinkDefinitionProvider,
  {
    disposable: vscode.Disposable
  }
> = new Map()

export function createLinkProvider() {
  const lp = new LinkDefinitionProvider()
  const lpDisposable = vscode.languages.registerDocumentLinkProvider({ pattern: `**/*` }, lp)

  linkProviders.set(lp, {
    disposable: lpDisposable,
  })
  return lp
}

export function disposeLinkProvider(lp: LinkDefinitionProvider) {
  const res = linkProviders.get(lp)
  if (!res) {
    return
  }
  res.disposable.dispose()
}

export function disposeAllLinkProviders() {
  linkProviders.forEach((res) => {
    res.disposable.dispose()
    return
  })
}
