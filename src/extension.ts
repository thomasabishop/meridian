import * as vscode from "vscode"
import { WorkspaceUtils } from "./utils/WorkspaceUtils"
import { IndexMetadataProvider } from "./views/metadata-index/IndexMetadataProvider"
import IndexHyperlinks from "./views/hyperlinks-index/IndexHyperlinks"

export async function activate(context: vscode.ExtensionContext) {
   const workspaceUtils = new WorkspaceUtils(context)
   const workspaceFiles = await workspaceUtils.readFromWorkspaceContext(
      "MERIDIAN_FILES"
   )

   workspaceUtils.indexWorkspaceFiles()

   /**
    * Register Views, and updaters
    */

   // Categories View
   const categoriesView = new IndexMetadataProvider(
      workspaceUtils.workspaceRoot as string,
      workspaceFiles,
      "categories"
   )
   vscode.window.registerTreeDataProvider("categories", categoriesView)

   const reindexCategoriesCommand: vscode.Disposable =
      vscode.commands.registerCommand("cats.reindex", () =>
         categoriesView.refreshIndex()
      )

   // Tags View
   const tagsView: IndexMetadataProvider = new IndexMetadataProvider(
      workspaceUtils.workspaceRoot as string,
      workspaceFiles,
      "tags"
   )
   vscode.window.registerTreeDataProvider("tags", tagsView)

   const reindexTagsCommand: vscode.Disposable =
      vscode.commands.registerCommand("tags.reindex", () =>
         tagsView.refreshIndex()
      )

   /**
    * Functions to execute on Workspace events
    */

   const reindexFilesOnMdFileCreation = vscode.workspace.onDidCreateFiles(
      (event) => {
         let containsMarkdown = event.files.some((uri) =>
            workspaceUtils.fileIsMd(uri.toString())
         )
         return containsMarkdown && workspaceUtils.indexWorkspaceFiles()
      }
   )

   const reindexFilesOnMdFileDeletion = vscode.workspace.onDidDeleteFiles(
      (event) => {
         let containsMarkdown = event.files.some((uri) =>
            workspaceUtils.fileIsMd(uri.toString())
         )

         return containsMarkdown && workspaceUtils.indexWorkspaceFiles()
      }
   )

   const reindexFilesOnMdFileRenaming = vscode.workspace.onDidRenameFiles(
      (event) => {
         let containsMarkdown = event.files.some((uri) =>
            workspaceUtils.fileIsMd(uri.toString())
         )

         return containsMarkdown && workspaceUtils.indexWorkspaceFiles()
      }
   )

   const reindexMetadataOnMdFileSave = vscode.workspace.onDidSaveTextDocument(
      (event) => {
         const refeshIndices = (): void => {
            categoriesView.refreshIndex()
            tagsView.refreshIndex()
         }
         return workspaceUtils.fileIsMd(event.fileName) && refeshIndices()
      }
      // TODO: Check this fires on event
   )

   // Add commands and functions to subscriptions context to dispose on Extension deactivation

   context.subscriptions.push(
      reindexCategoriesCommand,
      reindexTagsCommand,
      reindexMetadataOnMdFileSave,
      reindexFilesOnMdFileCreation,
      reindexFilesOnMdFileDeletion,
      reindexFilesOnMdFileRenaming
   )

   const indexHyperlinks = new IndexHyperlinks(workspaceFiles as string[])
   indexHyperlinks.returnOutlinks()
}

// this method is called when your extension is deactivated
export function deactivate() {}
