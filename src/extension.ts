import * as vscode from "vscode"
import { MetadataListingProvider } from "./IndexMetadata/MetadataListingProvider.provider"

export async function activate(context: vscode.ExtensionContext) {
  // console.log(vscode.workspace.getConfiguration().get("meridian.ignoreDirs"))
  const rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined

  // Initialize category listing view
  const categoryListing = new MetadataListingProvider(
    rootPath as string,
    "categories"
  )
  vscode.window.registerTreeDataProvider("categories", categoryListing)
  vscode.commands.registerCommand("cats.reindex", () =>
    categoryListing.refreshIndex()
  )

  // Initialize tag listing view
  const tagListing = new MetadataListingProvider(rootPath as string, "tags")
  vscode.window.registerTreeDataProvider("tags", tagListing)
  vscode.commands.registerCommand("tags.reindex", () =>
    tagListing.refreshIndex()
  )
}

// this method is called when your extension is deactivated
export function deactivate() {}
