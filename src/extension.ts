import { MeridianIndexCrud } from "./utils/MeridianIndexCrud"
import * as vscode from "vscode"
import { FileSystemUtils } from "./utils/FileSystemUtils"
import { Meridian } from "./Meridian"
import { IndexMetadataProvider } from "./views/treeviews/metadata/IndexMetadataProvider"
import { printChannelOutput } from "./helpers/logger"
import { IndexHyperlinksProvider } from "./views/treeviews/hyperlinks/IndexHyperlinksProvider"
import IndexHyperlinks, { LinkTypes } from "./views/treeviews/hyperlinks/IndexHyperlinks"
import { IndexMetadata, MetadataTypes } from "./views/treeviews/metadata/IndexMetadata"
import registerTreeView from "./helpers/registerTreeView"
import registerCommand, { ICommandParams } from "./helpers/registerCommand"
import { WorkspaceContextUtils } from "./utils/WorkspaceContextUtils"
import { ArrayUtils } from "./utils/ArrayUtils"

export async function activate(context: vscode.ExtensionContext) {
   try {
      const workspaceContextUtils = new WorkspaceContextUtils(context)
      const meridianIndexCrud = new MeridianIndexCrud(context)
      const fileSystemUtils = new FileSystemUtils()
      const arrayUtils = new ArrayUtils()
      const indexMetadata = new IndexMetadata(context)

      const activeEditor = vscode.window.activeTextEditor?.document.fileName
      const workspaceFiles = (await fileSystemUtils.collateWorkspaceFiles()) ?? []

      const indexHyperlinks = new IndexHyperlinks(workspaceFiles, meridianIndexCrud)

      const meridian = new Meridian(
         workspaceFiles,
         workspaceContextUtils,
         indexHyperlinks,
         indexMetadata,
         fileSystemUtils,
         arrayUtils,
         meridianIndexCrud
      )

      await meridian.init()

      // Register VSCode TreeViews...

      const outlinksView = registerTreeView(
         IndexHyperlinksProvider,
         LinkTypes.Outlinks,
         activeEditor,
         workspaceFiles,
         context,
         meridianIndexCrud,
         fileSystemUtils
      )

      const inlinksView = registerTreeView(
         IndexHyperlinksProvider,
         LinkTypes.Inlinks,
         activeEditor,
         workspaceFiles,
         context,
         meridianIndexCrud,
         fileSystemUtils
      )

      const categoriesView = registerTreeView(
         IndexMetadataProvider,
         MetadataTypes.Categories,
         context
      )

      const tagsView = registerTreeView(IndexMetadataProvider, MetadataTypes.Tags, context)

      const onEditorChange = vscode.window.onDidChangeActiveTextEditor(async (event) => {
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
      })

      const onFileSave = vscode.workspace.onDidSaveTextDocument(async (event) => {
         const savedFile = event.fileName
         if (fileSystemUtils.fileIsMd(savedFile) && workspaceFiles) {
            return await meridian.indexWorkspaceFile(savedFile).then(() => {
               categoriesView.refresh()
               tagsView.refresh()
               outlinksView.refresh(savedFile, LinkTypes.Outlinks)
               inlinksView.refresh(savedFile, LinkTypes.Inlinks)
            })
         }
      })

      const onFileDelete = vscode.workspace.onDidDeleteFiles(async (event) => {
         if (event.files) {
            meridian.removeEntries(event.files.map((file) => file.path)).then(() => {
               const currentlyActiveFile = vscode.window.activeTextEditor?.document?.fileName
               categoriesView.refresh()
               tagsView.refresh()
               outlinksView.refresh(currentlyActiveFile, LinkTypes.Outlinks)
               inlinksView.refresh(currentlyActiveFile, LinkTypes.Inlinks)
            })
         }
         return
      })

      const onFileRename = vscode.workspace.onDidRenameFiles(async (event) => {
         const currentlyActiveFile = vscode.window.activeTextEditor?.document?.fileName
         const renamedFiles = event?.files
         const [oldFileNames, newFileNames] = [
            renamedFiles.map(({ oldUri }) => oldUri?.path.toString()),
            renamedFiles.map(({ newUri }) => newUri?.path.toString()),
         ]
         meridian
            .removeEntries(oldFileNames)
            .then(() => {
               return Promise.all(newFileNames.map((file) => meridian.indexWorkspaceFile(file)))
            })
            .then(() => {
               categoriesView.refresh()
               tagsView.refresh()
               outlinksView.refresh(currentlyActiveFile, LinkTypes.Outlinks)
               inlinksView.refresh(currentlyActiveFile, LinkTypes.Inlinks)
            })
      })

      // Register VSCode Commands...

      const commands: ICommandParams[] = [
         {
            id: "categories.reindex",
            callback: () => categoriesView.refresh(),
            outputMessage: "Categories manually reindexed",
         },
         {
            id: "tags.reindex",
            callback: () => tagsView.refresh(),
            outputMessage: "Tags manually reindexed",
         },
         {
            id: "categories.scope",
            callback: () => {
               categoriesView.filterMetadataIndexForCurrentFile(
                  MetadataTypes.Categories,
                  vscode.window.activeTextEditor?.document.fileName
               )
               categoriesView.updateTreeviewScopedStatus(true, "meridian:scopeCats")
            },
            outputMessage: "Category filter applied",
         },
         {
            id: "categories.resetScope",
            callback: () => {
               categoriesView.updateTreeviewScopedStatus(false, "meridian:scopeCats")
               categoriesView.refresh()
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
               tagsView.refresh()
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
