import * as vscode from "vscode"
import { IndexMetadata } from "./IndexMetadata/IndexMetadata"
import { MetadataListing } from "./IndexMetadata/views/MetadataListing"

export async function activate(context: vscode.ExtensionContext) {
  const rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined

  const tags = new IndexMetadata(rootPath)
  const indexedTags = await tags.main()

  if (indexedTags !== undefined && typeof indexedTags !== "string") {
    vscode.window.createTreeView("tags", {
      treeDataProvider: new MetadataListing(indexedTags),
    })
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
