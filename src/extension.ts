import * as vscode from "vscode"
import { FileSystemUtils } from "./utils/FileSystemUtils"
import { IndexMetadataProvider } from "./views/metadata-index/IndexMetadataProvider"
import VsCodeExtensionScaffold from "./utils/VsCodeExtensionScaffold"

export async function activate(context: vscode.ExtensionContext) {
   const extScaffold = new VsCodeExtensionScaffold(context)
   let executeOnSave: vscode.Disposable

   /**
    * Register Views
    */
   const categoriesView = new IndexMetadataProvider(
      extScaffold.workspaceRoot as string,
      "categories"
   )
   vscode.window.registerTreeDataProvider("categories", categoriesView)

   const tagsView: IndexMetadataProvider = new IndexMetadataProvider(
      extScaffold.workspaceRoot as string,
      "tags"
   )
   vscode.window.registerTreeDataProvider("tags", tagsView)

   /**
    * Register VsCode commands and add to subscription context
    */
   extScaffold.registerCommands([
      {
         name: "cats.reindex",
         command: () => categoriesView.refreshIndex(),
      },
      {
         name: "tags.reindex",
         command: () => tagsView.refreshIndex(),
      },
   ])

   /**
    * Functions to execute on save of MD file
    */

   executeOnSave = vscode.workspace.onDidSaveTextDocument((event) => {
      const fsUtils = new FileSystemUtils()
      const refeshIndices = (): void => {
         categoriesView.refreshIndex()
         tagsView.refreshIndex()
      }
      return fsUtils.fileIsMd(event.fileName) && refeshIndices()
   })
}

// this method is called when your extension is deactivated
export function deactivate() {}
