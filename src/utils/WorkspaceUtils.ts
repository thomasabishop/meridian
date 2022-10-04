import { CustomTypeGuards } from "../types/CustomTypeGuards"
import { WorkspaceContextUtils } from "./WorkspaceContextUtils"
import * as path from "path"
import * as vscode from "vscode"
import * as readDirRecurse from "recursive-readdir"
import { FileSystemUtils } from "./FileSystemUtils"
import { IndexHyperlinks } from "../views/treeviews/hyperlinks-index/IndexHyperlinks"
import { IndexMetadata } from "../views/treeviews/metadata-index/IndexMetadata"
import { ValueOf } from "../types/ValueOf"
export class WorkspaceUtils {
   public workspaceFiles: any
   private _workspaceRoot: string | undefined
   private _dirsToIgnore: string[] | undefined
   private context: vscode.ExtensionContext
   private workspaceContextUtils: WorkspaceContextUtils
   private fileSystemUtils: FileSystemUtils
   private indexMetadata: IndexMetadata
   private customTypeGuard: CustomTypeGuards = new CustomTypeGuards()

   constructor(context: vscode.ExtensionContext) {
      this.context = context
      this._workspaceRoot = this.determineWorkspaceRoot()
      this.workspaceFiles = this.collateWorkspaceFiles()
      this._dirsToIgnore = this.retrieveDirsToIgnore(".git")
      this.workspaceContextUtils = new WorkspaceContextUtils(context)
      this.fileSystemUtils = new FileSystemUtils(this._workspaceRoot)
      this.indexMetadata = new IndexMetadata(context)
   }

   public get workspaceRoot() {
      return this._workspaceRoot
   }

   private get dirsToIgnore() {
      return this._dirsToIgnore
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

   public async filterMapEntryForPropertyOfType(
      propType: string,
      mapKey: string
   ): Promise<string | string[] | undefined> {
      if (mapKey !== undefined) {
         const meridianMap =
            await this.workspaceContextUtils.readFromWorkspaceContext(
               "MERIDIAN"
            )
         const mapEntry = meridianMap?.get(mapKey)
         if (mapEntry !== undefined) {
            return mapEntry[propType]
         }
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
      const allFiles = await this.collateWorkspaceFiles()
      if (this.customTypeGuard.isStringArray(allFiles)) {
         const indexHyperlinks: IndexHyperlinks = new IndexHyperlinks(
            this.context,
            allFiles
         )
         let workspace: IWorkspaceMap[] = []
         for (const file of allFiles) {
            let categories = await this.indexMetadata.extractMetadataForFile(
               file,
               "categories"
            )
            let tags = await this.indexMetadata.extractMetadataForFile(
               file,
               "tags"
            )
            let outlinks = await indexHyperlinks.parseFileForLinks(file)
            workspace.push({
               fullPath: file,
               title: this.fileSystemUtils.parseFileTitle(file),
               categories: categories,
               tags: tags,
               outlinks: outlinks,
            })
         }
         return workspace
      }
   }

   private determineWorkspaceRoot(): string | undefined {
      return vscode.workspace.workspaceFolders &&
         vscode.workspace.workspaceFolders.length > 0
         ? vscode.workspace.workspaceFolders[0].uri.fsPath
         : undefined
   }

   private retrieveDirsToIgnore(inp: string) {
      const ignoreDirs = vscode.workspace
         .getConfiguration()
         .get("meridian.ignoreDirs") as string[]
      if (!ignoreDirs?.length) {
         return
      }
      if (ignoreDirs !== undefined) {
         return [inp, ...ignoreDirs]
      }
   }
}

export interface IWorkspaceMap {
   [key: string]: string | string[] | undefined
   title: string
   fullPath: string
   categories?: string[]
   tags?: string[]
   outlinks?: string[]
}

export type ValueOfIWorkspaceMap = ValueOf<IWorkspaceMap>
