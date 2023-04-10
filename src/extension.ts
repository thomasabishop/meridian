import * as vscode from "vscode"
import { FileSystemUtils } from "./utils/FileSystemUtils"
import { Meridian } from "./main/Meridian"
import { IndexMetadataProvider } from "./views/treeviews/metadata-index/IndexMetadataProvider"
import { printChannelOutput } from "./helpers/logger"
import { IndexHyperlinksProvider } from "./views/treeviews/hyperlinks-index/IndexHyperlinksProvider"
import { LinkTypes } from "./views/treeviews/hyperlinks-index/IndexHyperlinks"
import { MetadataTypes } from "./views/treeviews/metadata-index/IndexMetadata"
import registerTreeView from "./helpers/registerTreeView"
import registerCommand, { CommandParams } from "./helpers/registerCommand"

/**
 *
 * @param context
 */

export async function activate(context: vscode.ExtensionContext) {
   const meridian = new Meridian(context)

   try {
      await meridian.indexWorkspace()
      const workspaceFiles = await meridian.collateWorkspaceFiles()
      const activeEditor = vscode.window.activeTextEditor?.document.fileName
      const fileSystemUtils = new FileSystemUtils()

      // Register VSCode TreeViews...
      const outlinksView = registerTreeView(
         IndexHyperlinksProvider,
         LinkTypes.Outlinks,
         activeEditor,
         workspaceFiles,
         context
      )

      const inlinksView = registerTreeView(
         IndexHyperlinksProvider,
         LinkTypes.Inlinks,
         activeEditor,
         workspaceFiles,
         context
      )

      const categoriesView = registerTreeView(
         IndexMetadataProvider,
         MetadataTypes.Categories,
         context
      )

      const tagsView = registerTreeView(
         IndexMetadataProvider,
         MetadataTypes.Tags,
         context
      )

      const onEditorChange = vscode.window.onDidChangeActiveTextEditor(
         async (event) => {
            let currentlyActiveFile = event?.document.fileName
            if (currentlyActiveFile !== undefined) {
               if (fileSystemUtils.fileIsMd(currentlyActiveFile)) {
                  // Refresh inlinks:
                  inlinksView.refresh(currentlyActiveFile, LinkTypes.Inlinks)
                  // Refresh outlinks:
                  outlinksView.refresh(currentlyActiveFile, LinkTypes.Outlinks)
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
               return await meridian.indexWorkspaceFile(savedFile).then(() => {
                  categoriesView.refreshIndex()
                  tagsView.refreshIndex()
                  outlinksView.refresh(savedFile, LinkTypes.Outlinks)
                  inlinksView.refresh(savedFile, LinkTypes.Inlinks)
               })
            }
         }
      )

      const onFileDelete = vscode.workspace.onDidDeleteFiles(async (event) => {
         if (event.files) {
            meridian
               .removeEntries(event.files.map((file) => file.path))
               .then(() => {
                  const currentlyActiveFile =
                     vscode.window.activeTextEditor?.document?.fileName
                  categoriesView.refreshIndex()
                  tagsView.refreshIndex()
                  outlinksView.refresh(currentlyActiveFile, LinkTypes.Outlinks)
                  inlinksView.refresh(currentlyActiveFile, LinkTypes.Inlinks)
               })
         }
         return
      })

      const onFileRename = vscode.workspace.onDidRenameFiles(async (event) => {
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
                  newFileNames.map((file) => meridian.indexWorkspaceFile(file))
               )
            })
            .then(() => {
               categoriesView.refreshIndex()
               tagsView.refreshIndex()
               outlinksView.refresh(currentlyActiveFile, LinkTypes.Outlinks)
               inlinksView.refresh(currentlyActiveFile, LinkTypes.Inlinks)
            })
      })

      // Register VSCode Commands...

      const commands: CommandParams[] = [
         {
            id: "categories.reindex",
            callback: () => categoriesView.refreshIndex(),
            outputMessage: "Categories manually reindexed",
         },
         {
            id: "tags.reindex",
            callback: () => tagsView.refreshIndex(),
            outputMessage: "Tags manually reindexed",
         },
         {
            id: "categories.scope",
            callback: () => {
               categoriesView.filterMetadataIndexForCurrentFile(
                  MetadataTypes.Categories,
                  vscode.window.activeTextEditor?.document.fileName
               )
               categoriesView.updateTreeviewScopedStatus(
                  true,
                  "meridian:scopeCats"
               )
            },
            outputMessage: "Category filter applied",
         },
         {
            id: "categories.resetScope",
            callback: () => {
               categoriesView.updateTreeviewScopedStatus(
                  false,
                  "meridian:scopeCats"
               )
               categoriesView.refreshIndex()
            },
            outputMessage: "Category filter reset",
         },
         {
            id: "tags.scope",
            callback: () => {
               tagsView.filterMetadataIndexForCurrentFile(
                  MetadataTypes.Tags,
                  vscode.window.activeTextEditor?.document.fileName
               )
               tagsView.updateTreeviewScopedStatus(true, "meridian:scopeTags")
            },
            outputMessage: "Tag filter applied",
         },
         {
            id: "tags.resetScope",
            callback: () => {
               tagsView.updateTreeviewScopedStatus(false, "meridian:scopeTags")
               tagsView.refreshIndex()
            },
            outputMessage: "Tag filter reset",
         },
      ]

      const commandDisposables: vscode.Disposable[] = commands.map((command) =>
         registerCommand(command, printChannelOutput)
      )

      context.subscriptions.push(
         onEditorChange,
         onFileSave,
         onFileDelete,
         onFileRename,
         ...commandDisposables
      )
   } catch (err) {
      console.error(err)
   }
}
