import { CustomTypeGuards } from "../utils/CustomTypeGuards"
import { WorkspaceContextUtils } from "../utils/WorkspaceContextUtils"
import * as path from "path"
import * as vscode from "vscode"
import * as readDirRecurse from "recursive-readdir"
import { FileSystemUtils } from "../utils/FileSystemUtils"
import { IndexHyperlinks } from "../views/treeviews/hyperlinks-index/IndexHyperlinks"
import {
   IndexMetadata,
   MetadataTypes,
} from "../views/treeviews/metadata-index/IndexMetadata"
import { printChannelOutput } from "../utils/logger"

export class Meridian {
   public workspaceRoot: string | undefined
   private dirsToIgnore: string[] | undefined
   private context: vscode.ExtensionContext
   private workspaceContextUtils: WorkspaceContextUtils
   private fileSystemUtils: FileSystemUtils
   private indexMetadata: IndexMetadata
   private customTypeGuard: CustomTypeGuards = new CustomTypeGuards()

   constructor(context: vscode.ExtensionContext) {
      this.context = context
      this.workspaceRoot = this.determineWorkspaceRoot()
      this.dirsToIgnore = this.retrieveDirsToIgnore(".git")
      this.workspaceContextUtils = new WorkspaceContextUtils(context)
      this.fileSystemUtils = new FileSystemUtils()
      this.indexMetadata = new IndexMetadata(context)
   }

   public async collateWorkspaceFiles(): Promise<string[] | undefined> {
      if (typeof this.workspaceRoot === "string") {
         return await readDirRecurse(
            path.resolve(this.workspaceRoot),
            this.dirsToIgnore
         )
      }
   }

   public async createMeridianIndex(): Promise<void | undefined> {
      const workspace = await this.indexWorkspace()

      if (workspace !== undefined) {
         return await this.workspaceContextUtils.writeToWorkspaceContext(
            "MERIDIAN",
            workspace
         )
      }
   }

   // public async indexSingleFile(
   //    file: string
   // ): Promise<Map<string, IWorkspaceMap> | undefined> {
   //    // In case where we are reindexing on save, it is not necessary to re-collate workspace files, it is only necessary if a file has been created, renamed, or deleted. As saving is more frequent than any of these other cases, blocking reindex here would be beneficial.

   //    const allFiles = await this.collateWorkspaceFiles()
   //    try {,
   //       if (this.customTypeGuard.isStringArray(allFiles)) {
   //          const indexHyperlinks: IndexHyperlinks = new IndexHyperlinks(
   //             this.context,
   //             allFiles
   //          )

   //          const outlinks = await indexHyperlinks.parseFileForLinks(file)
   //          const workspaceEntry: IWorkspaceMap = {
   //             fullPath: file,
   //             title: this.fileSystemUtils.parseFileTitle(file),
   //             categories: await this.indexMetadata.extractMetadataForFile(
   //                file,
   //                "categories"
   //             ),
   //             tags: await this.indexMetadata.extractMetadataForFile(
   //                file,
   //                "tags"
   //             ),
   //             outlinks: [...new Set(outlinks)],
   //             // inlinks: await indexHyperlinks.indexInlinks(file),
   //          }

   //          return await this.workspaceContextUtils.updateWorkspaceMapEntry(
   //             file,
   //             workspaceEntry
   //          )
   //       }
   //    } catch (err) {
   //       printChannelOutput(`${err}`, true, "error")
   //    } finally {
   //       printChannelOutput(`Added ${file} to Meridian index`)
   //    }
   // }

   private async indexWorkspace(): Promise<IMeridianIndex | undefined> {
      const allFiles = await this.collateWorkspaceFiles()
      try {
         if (this.customTypeGuard.isStringArray(allFiles)) {
            const indexHyperlinks: IndexHyperlinks = new IndexHyperlinks(
               this.context,
               allFiles
            )

            let meridianIndex: IMeridianIndex = {}

            for (const file of allFiles) {
               let outlinks = await indexHyperlinks.parseFileForLinks(file)

               meridianIndex[file] = {
                  fullPath: file,
                  title: this.fileSystemUtils.parseFileTitle(file),
                  categories: await this.indexMetadata.extractMetadataForFile(
                     file,
                     MetadataTypes.Categories
                  ),
                  tags: await this.indexMetadata.extractMetadataForFile(
                     file,
                     MetadataTypes.Tags
                  ),
                  outlinks: [...new Set(outlinks)],
                  inlinks: [],
               }
            }
            const collateWorkspaceWithInlinks =
               indexHyperlinks.collateInlinks(meridianIndex)

            return collateWorkspaceWithInlinks
         }
      } catch (err) {
         printChannelOutput(`${err}`, true, "error")
      } finally {
         if (allFiles !== undefined) {
            printChannelOutput(`${allFiles.length} files indexed`, false)
         }
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
      const ignoreDirs = vscode.workspace
         .getConfiguration("meridian")
         .get("dirsToIgnore") as string[]
      if (!ignoreDirs?.length) {
         return
      }
      if (ignoreDirs !== undefined) {
         printChannelOutput(
            `Meridian is ignoring the directories: ${ignoreDirs}`,
            false
         )
         return [inp, ...ignoreDirs]
      }
   }
}

export interface IMeridianIndex {
   [key: string]: IMeridianEntry
}

export interface IMeridianEntry {
   [key: string]: string | string[] | undefined
   title: string
   fullPath: string
   categories?: string[]
   tags?: string[]
   outlinks?: string[]
   inlinks?: string[]
}
