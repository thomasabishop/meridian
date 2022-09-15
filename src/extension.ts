import { IndexHyperlinksProvider } from "./views/hyperlinks-index/IndexHyperlinksProvider"
import { FileSystemUtils } from "./utils/FileSystemUtils"
import * as vscode from "vscode"
import { WorkspaceUtils } from "./utils/WorkspaceUtils"
import { IndexMetadataProvider } from "./views/metadata-index/IndexMetadataProvider"

export async function activate(context: vscode.ExtensionContext) {
   const workspaceUtils = new WorkspaceUtils(context)
   const fileSystemUtils = new FileSystemUtils()

   workspaceUtils.indexWorkspaceFiles().then(async () => {
      const workspaceFiles = await workspaceUtils.readFromWorkspaceContext(
         "MERIDIAN_FILES"
      )

      /**
       * Register Views, and updaters
       */

      const linksView = new IndexHyperlinksProvider(
         vscode.window.activeTextEditor?.document.fileName,
         workspaceFiles
      )
      linksView.refresh()
      vscode.window.registerTreeDataProvider("outlinks", linksView)

      // Categories View
      const categoriesView = new IndexMetadataProvider(
         workspaceFiles,
         "categories"
      )
      categoriesView.refreshIndex()
      vscode.window.registerTreeDataProvider("categories", categoriesView)

      const reindexCategoriesCommand: vscode.Disposable =
         vscode.commands.registerCommand("cats.reindex", () =>
            categoriesView.refreshIndex()
         )

      // Tags View
      const tagsView: IndexMetadataProvider = new IndexMetadataProvider(
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
               fileSystemUtils.fileIsMd(uri.toString())
            )
            return containsMarkdown && workspaceUtils.indexWorkspaceFiles()
         }
      )

      const reindexFilesOnMdFileDeletion = vscode.workspace.onDidDeleteFiles(
         (event) => {
            let containsMarkdown = event.files.some((uri) =>
               fileSystemUtils.fileIsMd(uri.toString())
            )

            return containsMarkdown && workspaceUtils.indexWorkspaceFiles()
         }
      )

      const reindexFilesOnMdFileRenaming = vscode.workspace.onDidRenameFiles(
         (event) => {
            let containsMarkdown = event.files.some((uri) =>
               fileSystemUtils.fileIsMd(uri.toString())
            )

            return containsMarkdown && workspaceUtils.indexWorkspaceFiles()
         }
      )

      const reindexMetadataOnMdFileSave =
         vscode.workspace.onDidSaveTextDocument(
            (event) => {
               const refeshIndices = (): void => {
                  categoriesView.refreshIndex()
                  tagsView.refreshIndex()
               }
               return (
                  fileSystemUtils.fileIsMd(event.fileName) && refeshIndices()
               )
            }
            // TODO: Check this fires on event
         )

      const reindexHyperlinks = vscode.window.onDidChangeActiveTextEditor(
         () => {
            //   linksView.updateActiveFile(activeFile)
            linksView.setActiveFile(
               vscode.window.activeTextEditor?.document.fileName
            )
            linksView.refresh()
         }
      )

      // Add commands and functions to subscriptions context to dispose on Extension deactivation

      context.subscriptions.push(
         reindexCategoriesCommand,
         reindexTagsCommand,
         reindexMetadataOnMdFileSave,
         reindexFilesOnMdFileCreation,
         reindexFilesOnMdFileDeletion,
         reindexFilesOnMdFileRenaming,
         reindexHyperlinks
      )
   })

   // const indexHyperlinks = new IndexHyperlinks(workspaceFiles as string[])
   // indexHyperlinks.returnOutlinks()
}

// this method is called when your extension is deactivated
export function deactivate() {}
