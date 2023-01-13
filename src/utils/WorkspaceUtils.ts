import { CustomTypeGuards } from "../types/CustomTypeGuards"
import { WorkspaceContextUtils } from "./WorkspaceContextUtils"
import * as path from "path"
import * as vscode from "vscode"
import * as readDirRecurse from "recursive-readdir"
import { FileSystemUtils } from "./FileSystemUtils"
import { IndexHyperlinks } from "../views/treeviews/hyperlinks-index/IndexHyperlinks"
import { IndexMetadata } from "../views/treeviews/metadata-index/IndexMetadata"
import IWorkspaceMap from "../types/IWorkspaceMap"
export class WorkspaceUtils {
   private _workspaceRoot: string | undefined
   private dirsToIgnore: string[] | undefined
   private context: vscode.ExtensionContext
   private workspaceContextUtils: WorkspaceContextUtils
   private fileSystemUtils: FileSystemUtils
   private indexMetadata: IndexMetadata
   private customTypeGuard: CustomTypeGuards = new CustomTypeGuards()

   constructor(context: vscode.ExtensionContext) {
      this.context = context
      this._workspaceRoot = this.determineWorkspaceRoot()
      this.dirsToIgnore = this.retrieveDirsToIgnore(".git")
      this.workspaceContextUtils = new WorkspaceContextUtils(context)
      this.fileSystemUtils = new FileSystemUtils(this._workspaceRoot)
      this.indexMetadata = new IndexMetadata(context)
   }

   public get workspaceFiles(): any {
      return this.collateWorkspaceFiles()
   }

   public get workspaceRoot() {
      return this._workspaceRoot
   }

   public async createMeridianMap(): Promise<void | undefined> {
      const meridianMap = new Map<string, IWorkspaceMap>()
      const workspace = await this.indexWorkspace()

      if (workspace !== undefined) {
         workspace.map((entry) => {
            meridianMap.set(entry.fullPath, entry)
         })

         return await this.workspaceContextUtils.writeToWorkspaceContext(
            "MERIDIAN",
            meridianMap
         )
      }
   }

   public async indexSingleFile(
      file: string
   ): Promise<Map<string, IWorkspaceMap> | undefined> {
      const allFiles = await this.collateWorkspaceFiles()
      if (this.customTypeGuard.isStringArray(allFiles)) {
         const indexHyperlinks: IndexHyperlinks = new IndexHyperlinks(
            this.context,
            allFiles
         )

         //   const outlinks = await indexHyperlinks.parseFileForLinks(file)
         const workspaceEntry: IWorkspaceMap = {
            fullPath: file,
            title: this.fileSystemUtils.parseFileTitle(file),
            categories: await this.indexMetadata.extractMetadataForFile(
               file,
               "categories"
            ),
            tags: await this.indexMetadata.extractMetadataForFile(file, "tags"),
            //     outlinks: [...new Set(outlinks)],
            inlinks: await indexHyperlinks.indexInlinks(file),
         }

         return await this.workspaceContextUtils.updateWorkspaceMapEntry(
            file,
            workspaceEntry
         )
      }
   }

   private async collateWorkspaceFiles(): Promise<string[] | undefined> {
      if (typeof this._workspaceRoot === "string") {
         return await readDirRecurse(
            path.resolve(this._workspaceRoot),
            this.dirsToIgnore
         )
      }
   }

   private async indexWorkspace(): Promise<IWorkspaceMap[] | undefined> {
      const allFiles = await this.workspaceFiles

      if (this.customTypeGuard.isStringArray(allFiles)) {
         const indexHyperlinks: IndexHyperlinks = new IndexHyperlinks(
            this.context,
            allFiles
         )
         let workspace: IWorkspaceMap[] = []
         for (const file of allFiles) {
            //    let outlinks = await indexHyperlinks.parseFileForLinks(file)
            workspace.push({
               fullPath: file,
               title: this.fileSystemUtils.parseFileTitle(file),
               categories: await this.indexMetadata.extractMetadataForFile(
                  file,
                  "categories"
               ),
               tags: await this.indexMetadata.extractMetadataForFile(
                  file,
                  "tags"
               ),
               //      outlinks: [...new Set(outlinks)],
            })
         }
         return workspace
      }
   }

   // Add update method to WorkspaceContextUtils to fully replace singleUpdate func
   private determineWorkspaceRoot(): string | undefined {
      return vscode.workspace.workspaceFolders &&
         vscode.workspace.workspaceFolders.length > 0
         ? vscode.workspace.workspaceFolders[0].uri.fsPath
         : undefined
   }

   private retrieveDirsToIgnore(inp: string) {
      console.log("got here")
      const ignoreDirs = vscode.workspace
         .getConfiguration("meridian")
         .get("dirsToIgnore") as string[]
      console.log(ignoreDirs)
      if (!ignoreDirs?.length) {
         return
      }
      if (ignoreDirs !== undefined) {
         return [inp, ...ignoreDirs]
      }
   }
}
