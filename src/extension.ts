import * as vscode from "vscode"
import { FileSystemUtils } from "./utils/FileSystemUtils"
import { WorkspaceContextUtils } from "./utils/WorkspaceContextUtils"
import { IndexInlinksProvider } from "./views/treeviews/hyperlinks-index/IndexInlinksProvider"
import { IndexOutlinksProvider } from "./views/treeviews/hyperlinks-index/IndexOutlinksProvider"
import { WorkspaceUtils } from "./utils/WorkspaceUtils"
import { IndexMetadataProvider } from "./views/treeviews/metadata-index/IndexMetadataProvider"

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
         
         * // TODO: Need to rewrite most of these so that it is just a file that is being added/deleted from the Meridian map, to remove the need to reindex every file.
          */

         const onChangeEditorActions =
            vscode.window.onDidChangeActiveTextEditor((event) => {
               // Refresh inlinks:
               inlinksView.refresh(event?.document.fileName)

               // Refresh outlinks:
               outlinksView.refresh(event?.document.fileName)

               // Clear category scoping:
               categoriesView.updateTreeviewScopedStatus(
                  false,
                  "meridian:scopeCats"
               )
               categoriesView.refreshIndex()

               // Clear tag scoping:
               tagsView.updateTreeviewScopedStatus(false, "meridian:scopeTags")
               tagsView.refreshIndex()
            })

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
          * Commands
          */

         // Show categories for the current editor only:
         const scopeCatsCommand: vscode.Disposable =
            vscode.commands.registerCommand("cats.scope", () => {
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
            updateMeridianMapOnFileSave,
            updateMeridianMapOnFileRename,
            updateMeridianMapOnFileDelete,
            updateMeridianMapOnFileCreate,
            scopeCatsCommand,
            scopeCatsResetCommand,
            scopeTagsCommand,
            scopeTagsResetCommand
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
