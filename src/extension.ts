import { FileSystemUtils } from "./utils/FileSystemUtils"
import { IndexInlinksProvider } from "./views/hyperlinks-index/IndexInlinksProvider"
import { WorkspaceContextUtils } from "./utils/WorkspaceContextUtils"
import { IndexOutlinksProvider } from "./views/hyperlinks-index/IndexOutlinksProvider"
import * as vscode from "vscode"
import { WorkspaceUtils } from "./utils/WorkspaceUtils"
import { IndexMetadataProvider } from "./views/metadata-index/IndexMetadataProvider"

export async function activate(context: vscode.ExtensionContext) {
   const workspaceUtils = new WorkspaceUtils(context)

   await workspaceUtils
      .createMeridianMap()
      .then(async () => {
         const workspaceFiles = workspaceUtils.workspaceFiles
         const workspaceRoot = workspaceUtils.workspaceRoot
         const activeEditor = vscode.window.activeTextEditor?.document.fileName
         const fileSystemUtils = new FileSystemUtils(workspaceRoot)

         /**
          * Register views on initialisation
          */

         // HYPERLINKS

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

         // METADATA INDICES

         const categoriesView = new IndexMetadataProvider(context, "categories")
         categoriesView.refreshIndex()
         vscode.window.registerTreeDataProvider("categories", categoriesView)

         const tagsView = new IndexMetadataProvider(context, "tags")
         tagsView.refreshIndex()
         vscode.window.registerTreeDataProvider("tags", tagsView)

         /**
          * Refresh views on workspace events
          * // TODO: Need to rewrite most of these so that it is just a file that is being added/deleted from the Meridian map, to remove the need to reindex every file.
          */

         const refreshHyperlinks = vscode.window.onDidChangeActiveTextEditor(
            (event) => {
               inlinksView.refresh(event?.document.fileName)
               outlinksView.refresh(event?.document.fileName)
            }
         )

         const updateMeridianMapOnFileSave =
            vscode.workspace.onDidSaveTextDocument(async (event) => {
               let isMarkdownSave = fileSystemUtils.fileIsMd(event.fileName)
               if (isMarkdownSave) {
                  await workspaceUtils.createMeridianMap().then(() => {
                     categoriesView.refreshIndex()
                     tagsView.refreshIndex()
                     outlinksView.refresh(event.fileName)
                     inlinksView.refresh(event.fileName)
                  })
               }
            })

         const updateMeridianMapOnFileRename =
            vscode.workspace.onDidRenameFiles(async (event) => {
               let isMarkdownRename = event.files.some((uri) =>
                  fileSystemUtils.fileIsMd(uri.toString())
               )
               if (isMarkdownRename) {
                  await workspaceUtils.createMeridianMap()
               }
            })

         const updateMeridianMapOnFileDelete =
            vscode.workspace.onDidDeleteFiles(async (event) => {
               let isMarkdownRename = event.files.some((uri) =>
                  fileSystemUtils.fileIsMd(uri.toString())
               )
               if (isMarkdownRename) {
                  await workspaceUtils.createMeridianMap()
               }
            })

         const updateMeridianMapOnFileCreate =
            vscode.workspace.onDidRenameFiles(async (event) => {
               let isMarkdownRename = event.files.some((uri) =>
                  fileSystemUtils.fileIsMd(uri.toString())
               )
               if (isMarkdownRename) {
                  await workspaceUtils.createMeridianMap()
               }
            })
         /**
          * Subscription disposal
          */
         context.subscriptions.push(
            refreshHyperlinks,
            updateMeridianMapOnFileSave,
            updateMeridianMapOnFileRename,
            updateMeridianMapOnFileDelete,
            updateMeridianMapOnFileCreate
         )
      })

      .catch((err) => {
         console.error(err)
      })
}

// this method is called when your extension is deactivated
export async function deactivate(context: vscode.ExtensionContext) {
   // Delete workspace data on deactivation
   const workspaceContextUtils = new WorkspaceContextUtils(context)
   await workspaceContextUtils.clearWorkspaceContextItem("MERIDIAN")
}
