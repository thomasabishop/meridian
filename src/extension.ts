import * as vscode from "vscode"
import { FileSystemUtils } from "./utils/FileSystemUtils"
import { WorkspaceContextUtils } from "./utils/WorkspaceContextUtils"
import { IndexInlinksProvider } from "./views/treeviews/hyperlinks-index/IndexInlinksProvider"
import { IndexOutlinksProvider } from "./views/treeviews/hyperlinks-index/IndexOutlinksProvider"
import { WorkspaceUtils } from "./utils/WorkspaceUtils"
import { IndexMetadataProvider } from "./views/treeviews/metadata-index/IndexMetadataProvider"
import { printChannelOutput } from "./utils/logger"

export async function activate(context: vscode.ExtensionContext) {
   const workspaceUtils = new WorkspaceUtils(context)
   await workspaceUtils
      .createMeridianMap()
      .then(async () => {
         const workspaceFiles = await workspaceUtils.workspaceFiles
         const workspaceRoot = workspaceUtils.workspaceRoot
         const activeEditor = vscode.window.activeTextEditor?.document.fileName
         const fileSystemUtils = new FileSystemUtils()
         const workspaceContextutils = new WorkspaceContextUtils(context)

         /**
          * Register views
          */

         // Hyperlinks

         const outlinksView = new IndexOutlinksProvider(
            vscode.window.activeTextEditor?.document.fileName,
            workspaceRoot,
            workspaceFiles,
            context
         )
         outlinksView.refresh(activeEditor)
         vscode.window.registerTreeDataProvider("outlinks", outlinksView)

         const inlinksView = new IndexInlinksProvider(
            vscode.window.activeTextEditor?.document.fileName,
            workspaceRoot,
            workspaceFiles,
            context
         )
         inlinksView.refresh(activeEditor)
         vscode.window.registerTreeDataProvider("inlinks", inlinksView)

         // Metadata indices

         const categoriesView = new IndexMetadataProvider(context, "categories")
         categoriesView.refreshIndex()
         vscode.window.registerTreeDataProvider("categories", categoriesView)

         const tagsView = new IndexMetadataProvider(context, "tags")
         tagsView.refreshIndex()
         vscode.window.registerTreeDataProvider("tags", tagsView)

         /**
          * Actions to execute on workspace events
          */

         const onChangeEditorActions =
            vscode.window.onDidChangeActiveTextEditor(async (event) => {
               if (event?.document.fileName !== undefined) {
                  if (fileSystemUtils.fileIsMd(event?.document.fileName)) {
                     // Refresh inlinks:
                     inlinksView.refresh(event?.document.fileName)
                     // Refresh outlinks:
                     outlinksView.refresh(event?.document.fileName)
                     // Log event
                     printChannelOutput(
                        `Editor changed: refreshed inlinks/outlinks for file ${event?.document.fileName}`
                     )
                  }
               }
            })

         const updateWorkspaceMapOnFileSave =
            vscode.workspace.onDidSaveTextDocument(async (event) => {
               if (fileSystemUtils.fileIsMd(event.fileName)) {
                  await workspaceUtils
                     .indexSingleFile(event.fileName)
                     .then(() => {
                        categoriesView.refreshIndex()
                        tagsView.refreshIndex()
                        outlinksView.refresh(event.fileName)
                        inlinksView.refresh(event.fileName)
                     })
                     .catch((err) => {
                        printChannelOutput(err, true, "error")
                     })
                     .finally(() => {
                        printChannelOutput(
                           `File ${event.fileName} saved: refreshed metadata`,
                           false
                        )
                     })
               }
            })

         // Force full reindex of workspace map if file is renamed or moved to different sub-directory
         // TODO: Tech debt: not happy about the inefficiency of this but unable to reindex single file and  have cat and tag tree views update in response.

         const updateMeridianMapOnFileRename =
            vscode.workspace.onDidRenameFiles(async (event) => {
               const changedFile = event?.files
               const isMarkdownRename = changedFile.some((uri) =>
                  fileSystemUtils.fileIsMd(uri?.newUri.toString())
               )

               if (isMarkdownRename) {
                  workspaceUtils
                     .createMeridianMap()
                     .then(() => {
                        categoriesView.refreshIndex()
                        tagsView.refreshIndex()
                     })
                     .catch((err) => {
                        printChannelOutput(`${err}`, true, "error")
                     })
                     .finally(() => {
                        printChannelOutput(
                           `File ${changedFile[0].oldUri.path} renamed to ${changedFile[0].newUri.path}. Metadata updated.`
                        )
                     })
               }
            })

         const updateMeridianMapOnFileDelete =
            vscode.workspace.onDidDeleteFiles(async (event) => {
               if (event.files) {
                  await Promise.all(
                     event.files.map(async (file) => {
                        workspaceContextutils.deleteWorkspaceMapEntry(file.path)
                     })
                  )
                     .then(() => {
                        categoriesView.refreshIndex()
                        tagsView.refreshIndex()
                     })
                     .catch((err) => {
                        printChannelOutput(`${err}`, true, "error")
                     })
                     .finally(() => {
                        const deletedFiles = event.files.map(
                           (file) => file.path
                        )
                        printChannelOutput(
                           `Deleted files: ${deletedFiles}. Metadata updated.`
                        )
                     })
               }
            })

         /**
          * Commands
          */

         // Manually reindex categories
         const reindexCatsCommand: vscode.Disposable =
            vscode.commands.registerCommand("cats.reindex", () => {
               printChannelOutput("Categories manually reindexed", false)
               return categoriesView.refreshIndex()
            })

         // Manually reindex tags
         const reindexTagsCommand: vscode.Disposable =
            vscode.commands.registerCommand("tags.reindex", () => {
               printChannelOutput("Tags manually reindexed", false)
               return tagsView.refreshIndex()
            })

         // Show categories for the current editor only:
         const scopeCatsCommand: vscode.Disposable =
            vscode.commands.registerCommand("cats.scope", () => {
               printChannelOutput("Category filter applied", false)
               categoriesView.filterMetadataIndexForCurrentFile(
                  "categories",
                  vscode.window.activeTextEditor?.document.fileName
               ),
                  categoriesView.updateTreeviewScopedStatus(
                     true,
                     "meridian:scopeCats"
                  )
            })

         // Show all categories:
         const scopeCatsResetCommand: vscode.Disposable =
            vscode.commands.registerCommand("cats.resetScope", () => {
               categoriesView.updateTreeviewScopedStatus(
                  false,
                  "meridian:scopeCats"
               )
               categoriesView.refreshIndex()
            })

         // Show tags for the current editor only:
         const scopeTagsCommand: vscode.Disposable =
            vscode.commands.registerCommand("tags.scope", () => {
               printChannelOutput("Tag filter applied", false)
               tagsView.filterMetadataIndexForCurrentFile(
                  "tags",
                  vscode.window.activeTextEditor?.document.fileName
               ),
                  tagsView.updateTreeviewScopedStatus(
                     true,
                     "meridian:scopeTags"
                  )
            })

         // Show all tags:
         const scopeTagsResetCommand: vscode.Disposable =
            vscode.commands.registerCommand("tags.resetScope", () => {
               tagsView.updateTreeviewScopedStatus(false, "meridian:scopeTags")
               tagsView.refreshIndex()
            })

         /**
          * Subscriptions
          */

         context.subscriptions.push(
            onChangeEditorActions,
            updateWorkspaceMapOnFileSave,
            updateMeridianMapOnFileRename,
            updateMeridianMapOnFileDelete,
            scopeCatsCommand,
            scopeCatsResetCommand,
            scopeTagsCommand,
            scopeTagsResetCommand,
            reindexCatsCommand,
            reindexTagsCommand
         )
      })

      .catch((err) => {
         console.error(err)
      })
}
