import * as vscode from "vscode"
import { FileSystemUtils } from "./utils/FileSystemUtils"
import { IndexMetadataProvider } from "./views/metadata-index/IndexMetadataProvider"
import IndexHyperlinks from "./views/hyperlinks-index/IndexHyperlinks"

export async function activate(context: vscode.ExtensionContext) {
   // const extScaffold = new VsCodeExtensionScaffold(context)

   const workspaceRoot =
      vscode.workspace.workspaceFolders &&
      vscode.workspace.workspaceFolders.length > 0
         ? vscode.workspace.workspaceFolders[0].uri.fsPath
         : undefined

   /**
    * Register Views, and updaters
    */

   // Categories View
   const categoriesView = new IndexMetadataProvider(
      workspaceRoot as string,
      "categories"
   )
   vscode.window.registerTreeDataProvider("categories", categoriesView)

   const reindexCategoriesCommand: vscode.Disposable =
      vscode.commands.registerCommand("cats.reindex", () =>
         categoriesView.refreshIndex()
      )

   // Tags View
   const tagsView: IndexMetadataProvider = new IndexMetadataProvider(
      workspaceRoot as string,
      "tags"
   )
   vscode.window.registerTreeDataProvider("tags", tagsView)

   const reindexTagsCommand: vscode.Disposable =
      vscode.commands.registerCommand("tags.reindex", () =>
         tagsView.refreshIndex()
      )

   /**
    * Functions to execute on save of MD file
    */

   const reindexMetadataonSave = vscode.workspace.onDidSaveTextDocument(
      (event) => {
         const fsUtils = new FileSystemUtils()
         const refeshIndices = (): void => {
            categoriesView.refreshIndex()
            tagsView.refreshIndex()
         }
         return fsUtils.fileIsMd(event.fileName) && refeshIndices()
      }
   )

   // Add commands and functions to subscriptions context to dispose on Extension deactivation
   context.subscriptions.push(
      reindexCategoriesCommand,
      reindexTagsCommand,
      reindexMetadataonSave
   )

   const indexHyperlinks = new IndexHyperlinks(workspaceRoot)
   indexHyperlinks.returnOutlinks()
}

// this method is called when your extension is deactivated
export function deactivate() {}
