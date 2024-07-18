import * as vscode from "vscode"

export async function askWorkspace(): Promise<vscode.WorkspaceFolder | undefined> {
  const workspaceFolders = vscode.workspace.workspaceFolders ?? []
  if (workspaceFolders.length === 0) {
    vscode.window.showErrorMessage("No workspaces are currently opened.")
    return
  }

  let selectedWorkspaceName: string | undefined
  if (workspaceFolders.length === 1) {
    selectedWorkspaceName = workspaceFolders[0].name
  } else {
    selectedWorkspaceName = await vscode.window.showQuickPick(
      workspaceFolders.map((folder) => folder.name),
      {
        placeHolder: "Select a workspace",
      },
    )

    if (!selectedWorkspaceName) {
      vscode.window.showInformationMessage("No workspace was selected.")
      return
    }
  }

  const selectedWorkspace = workspaceFolders.find((folder) => folder.name === selectedWorkspaceName)
  if (!selectedWorkspace) {
    vscode.window.showErrorMessage("Failed to find the selected workspace.")
    return
  }

  return selectedWorkspace
}
