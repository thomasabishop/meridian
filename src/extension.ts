import * as vscode from "vscode"
import { IndexMetadata } from "./IndexMetadata/IndexMetadata"
import { MetadataListingProvider } from "./IndexMetadata/views/MetadataListingProvider"

export async function activate(context: vscode.ExtensionContext) {
  // console.log(vscode.workspace.getConfiguration().get("meridian.ignoreDirs"))
  const rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined

  const metadataListingProvider = new MetadataListingProvider(
    rootPath as string
  )

  vscode.window.registerTreeDataProvider("tags", metadataListingProvider)
  vscode.commands.registerCommand("tags.reindex", () =>
    metadataListingProvider.refreshIndex()
  )
}

// this method is called when your extension is deactivated
export function deactivate() {}
