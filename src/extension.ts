import * as vscode from "vscode"
import { FileSystemUtils } from "./utils/FileSystemUtils"
import { WorkspaceContextUtils } from "./utils/WorkspaceContextUtils"
import { Meridian } from "./main/Meridian"
import { IndexMetadataProvider } from "./views/treeviews/metadata-index/IndexMetadataProvider"
import { printChannelOutput } from "./utils/logger"
import { IndexHyperlinksProvider } from "./views/treeviews/hyperlinks-index/IndexHyperlinksProvider"
import { LinkTypes } from "./views/treeviews/hyperlinks-index/IndexHyperlinks"
import { MetadataTypes } from "./views/treeviews/metadata-index/IndexMetadata"

export async function activate(context: vscode.ExtensionContext) {
   const meridian = new Meridian(context)
   await meridian
      .createMeridianIndex()
      .then(async () => {
         const workspaceFiles = await meridian.collateWorkspaceFiles()
         const workspaceRoot = meridian.workspaceRoot
         const activeEditor = vscode.window.activeTextEditor?.document.fileName
         const fileSystemUtils = new FileSystemUtils()
         const workspaceContextUtils = new WorkspaceContextUtils(context)

         const workspaceState =
            await workspaceContextUtils.readFromWorkspaceContext("MERIDIAN")
         //         console.log(workspaceState)
         /**
          * Register views
          */

         // Hyperlinks

         const outlinksView = new IndexHyperlinksProvider(
            vscode.window.activeTextEditor?.document.fileName,
            workspaceFiles,
            context
         )

         outlinksView.refresh(activeEditor, LinkTypes.Outlinks)
         vscode.window.registerTreeDataProvider("outlinks", outlinksView)

         const inlinksView = new IndexHyperlinksProvider(
            vscode.window.activeTextEditor?.document.fileName,
            workspaceFiles,
            context
         )
         inlinksView.refresh(activeEditor, LinkTypes.Inlinks)
         vscode.window.registerTreeDataProvider("inlinks", inlinksView)

         // Metadata indices

         const categoriesView = new IndexMetadataProvider(
            context,
            MetadataTypes.Categories
         )
         categoriesView.refreshIndex()
         vscode.window.registerTreeDataProvider("categories", categoriesView)

         const tagsView = new IndexMetadataProvider(context, MetadataTypes.Tags)
         tagsView.refreshIndex()
         vscode.window.registerTreeDataProvider("tags", tagsView)

         /**
          * Actions to execute on workspace events
          */

         const onEditorChange = vscode.window.onDidChangeActiveTextEditor(
            async (event) => {
               let currentlyActiveFile = event?.document.fileName
               if (currentlyActiveFile !== undefined) {
                  if (fileSystemUtils.fileIsMd(currentlyActiveFile)) {
                     // Refresh inlinks:
                     inlinksView.refresh(currentlyActiveFile, LinkTypes.Inlinks)
                     // Refresh outlinks:
                     outlinksView.refresh(
                        currentlyActiveFile,
                        LinkTypes.Outlinks
                     )
                     // Log event
                     printChannelOutput(
                        `Editor changed: refreshed inlinks/outlinks for file ${event?.document.fileName}`
                     )
                  }
               }
            }
         )

         const onFileSave = vscode.workspace.onDidSaveTextDocument(
            async (event) => {
               const savedFile = event.fileName
               if (fileSystemUtils.fileIsMd(savedFile) && workspaceFiles) {
                  console.log("new save")
                  return await meridian
                     .reindexWorkspaceFile(savedFile, workspaceFiles)
                     .then(() => {
                        categoriesView.refreshIndex()
                        tagsView.refreshIndex()
                        outlinksView.refresh(savedFile, LinkTypes.Outlinks)
                        inlinksView.refresh(savedFile, LinkTypes.Inlinks)
                     })
               }
            }
         )

         // Force full reindex of workspace map if file is renamed or moved to different sub-directory
         // TODO: Tech debt: not happy about the inefficiency of this but unable to reindex single file and  have cat and tag tree views update in response.

         const updateMeridianMapOnFileRename =
            vscode.workspace.onDidRenameFiles(async (event) => {
               const changedFile = event?.files
               const isMarkdownRename = changedFile.some((uri) =>
                  fileSystemUtils.fileIsMd(uri?.newUri.toString())
               )

               if (isMarkdownRename) {
                  meridian
                     .createMeridianIndex()
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

         // const updateMeridianMapOnFileDelete =
         //    vscode.workspace.onDidDeleteFiles(async (event) => {
         //       if (event.files) {
         //          await Promise.all(
         //             event.files.map(async (file) => {
         //                workspaceContextutils.deleteWorkspaceMapEntry(file.path)
         //             })
         //          )
         //             .then(() => {
         //                categoriesView.refreshIndex()
         //                tagsView.refreshIndex()
         //             })
         //             .catch((err) => {
         //                printChannelOutput(`${err}`, true, "error")
         //             })
         //             .finally(() => {
         //                const deletedFiles = event.files.map(
         //                   (file) => file.path
         //                )
         //                printChannelOutput(
         //                   `Deleted files: ${deletedFiles}. Metadata updated.`
         //                )
         //             })
         //       }
         //    })

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
                  MetadataTypes.Categories,
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
                  MetadataTypes.Tags,
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
            onEditorChange,
            onFileSave,
            updateMeridianMapOnFileRename,
            //  updateMeridianMapOnFileDelete,
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
