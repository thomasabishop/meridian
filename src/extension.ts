import * as vscode from "vscode"
import { FileSystemUtils } from "./utils/FileSystemUtils"
import { Meridian } from "./main/Meridian"
import { IndexMetadataProvider } from "./views/treeviews/metadata-index/IndexMetadataProvider"
import { printChannelOutput } from "./utils/logger"
import { IndexHyperlinksProvider } from "./views/treeviews/hyperlinks-index/IndexHyperlinksProvider"
import { LinkTypes } from "./views/treeviews/hyperlinks-index/IndexHyperlinks"
import { MetadataTypes } from "./views/treeviews/metadata-index/IndexMetadata"

export async function activate(context: vscode.ExtensionContext) {
   const meridian = new Meridian(context)
   await meridian
      .indexWorkspace()
      .then(async () => {
         const workspaceFiles = await meridian.collateWorkspaceFiles()
         const activeEditor = vscode.window.activeTextEditor?.document.fileName
         const fileSystemUtils = new FileSystemUtils()

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
                  return await meridian
                     .indexWorkspaceFile(savedFile)
                     .then(() => {
                        categoriesView.refreshIndex()
                        tagsView.refreshIndex()
                        outlinksView.refresh(savedFile, LinkTypes.Outlinks)
                        inlinksView.refresh(savedFile, LinkTypes.Inlinks)
                     })
               }
            }
         )

         const onFileDelete = vscode.workspace.onDidDeleteFiles(
            async (event) => {
               if (event.files) {
                  meridian
                     .removeEntries(event.files.map((file) => file.path))
                     .then(() => {
                        const currentlyActiveFile =
                           vscode.window.activeTextEditor?.document?.fileName
                        categoriesView.refreshIndex()
                        tagsView.refreshIndex()
                        outlinksView.refresh(
                           currentlyActiveFile,
                           LinkTypes.Outlinks
                        )
                        inlinksView.refresh(
                           currentlyActiveFile,
                           LinkTypes.Inlinks
                        )
                     })
               }
               return
            }
         )

         const onFileRename = vscode.workspace.onDidRenameFiles(
            async (event) => {
               const currentlyActiveFile =
                  vscode.window.activeTextEditor?.document?.fileName
               const renamedFiles = event?.files
               const [oldFileNames, newFileNames] = [
                  renamedFiles.map(({ oldUri }) => oldUri?.path.toString()),
                  renamedFiles.map(({ newUri }) => newUri?.path.toString()),
               ]
               meridian
                  .removeEntries(oldFileNames)
                  .then(() => {
                     return Promise.all(
                        newFileNames.map((file) =>
                           meridian.indexWorkspaceFile(file)
                        )
                     )
                  })
                  .then(() => {
                     categoriesView.refreshIndex()
                     tagsView.refreshIndex()
                     outlinksView.refresh(
                        currentlyActiveFile,
                        LinkTypes.Outlinks
                     )
                     inlinksView.refresh(currentlyActiveFile, LinkTypes.Inlinks)
                  })
            }
         )

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
            onFileDelete,
            onFileRename,
            // updateMeridianMapOnFileRename,
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
