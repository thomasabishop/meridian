import { FileSystemUtils } from "./utils/FileSystemUtils"
import * as vscode from "vscode"
import { IndexMetadataProvider } from "./views/metadata-index/IndexMetadataProvider"
export async function activate(context: vscode.ExtensionContext) {
   // console.log(vscode.workspace.getConfiguration().get("meridian.ignoreDirs"))
   const rootPath =
      vscode.workspace.workspaceFolders &&
      vscode.workspace.workspaceFolders.length > 0
         ? vscode.workspace.workspaceFolders[0].uri.fsPath
         : undefined

   // Initialize category listing view
   const categoryListing = new IndexMetadataProvider(
      rootPath as string,
      "categories"
      /*  */
   )
   vscode.window.registerTreeDataProvider("categories", categoryListing)

   // Add reindex command for categories as disposable subscription
   const reindexCategoriesCommand: vscode.Disposable =
      vscode.commands.registerCommand("cats.reindex", () =>
         categoryListing.refreshIndex()
      )

   // Initialize tag listing view
   const tagListing: IndexMetadataProvider = new IndexMetadataProvider(
      rootPath as string,
      "tags"
   )
   vscode.window.registerTreeDataProvider("tags", tagListing)

   // Add reindex command for tags as disposable subscription
   const reindexTagsCommand: vscode.Disposable =
      vscode.commands.registerCommand("tags.reindex", () =>
         tagListing.refreshIndex()
      )

   const reindexOnSave: vscode.Disposable =
      vscode.workspace.onDidSaveTextDocument((event) => {
         const fsUtils = new FileSystemUtils()
         const refeshIndices = (): void => {
            categoryListing.refreshIndex()
            tagListing.refreshIndex()
         }
         return fsUtils.fileIsMd(event.fileName) && refeshIndices()
      })

   // Add to subscriptions context to dispose on Extension deactivation
   context.subscriptions.push(
      reindexCategoriesCommand,
      reindexTagsCommand,
      reindexOnSave
   )
}

// this method is called when your extension is deactivated
export function deactivate() {}
