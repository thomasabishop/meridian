import { ArrayUtils } from "./../utils/ArrayUtils"
import { IndexHyperlinks } from "./../views/treeviews/hyperlinks-index/IndexHyperlinks"
import { MeridianIndexCrud } from "./MeridianIndexCrud"
import { WorkspaceContextUtils } from "../utils/WorkspaceContextUtils"
import * as path from "path"
import * as vscode from "vscode"
import * as readDirRecurse from "recursive-readdir"
import { FileSystemUtils } from "../utils/FileSystemUtils"
import {
   IndexMetadata,
   MetadataTypes,
} from "../views/treeviews/metadata-index/IndexMetadata"
import { printChannelOutput } from "../utils/logger"
import { LinkTypes } from "./../views/treeviews/hyperlinks-index/IndexHyperlinks"
export class Meridian {
   public workspaceRoot: string | undefined
   private dirsToIgnore: string[] | undefined
   private context: vscode.ExtensionContext
   private workspaceContextUtils: WorkspaceContextUtils
   private fileSystemUtils: FileSystemUtils
   private indexMetadata: IndexMetadata
   private arrayUtils: ArrayUtils = new ArrayUtils()
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

   private async indexWorkspace(): Promise<IMeridianIndex | undefined> {
      const allFiles = await this.collateWorkspaceFiles()
      try {
         if (this.arrayUtils.isStringArray(allFiles)) {
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
               indexHyperlinks.collateAllInlinks(meridianIndex)

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

   public async reindexWorkspaceFile(updatedFile: string, allFiles: string[]) {
      const meridianIndexCrud = new MeridianIndexCrud(this.context)
      const indexHyperlinks = new IndexHyperlinks(this.context, allFiles)
      const existingEntry = await meridianIndexCrud.getMeridianEntry(
         updatedFile
      )

      if (existingEntry) {
         const { categories, tags, outlinks } = existingEntry

         const reindexedCategories =
            await this.indexMetadata.extractMetadataForFile(
               updatedFile,
               MetadataTypes.Categories
            )

         if (categories && reindexedCategories) {
            if (this.arrayUtils.changesExist(categories, reindexedCategories)) {
               await meridianIndexCrud.updateMeridianEntryProperty(
                  MetadataTypes.Categories,
                  existingEntry.fullPath,
                  reindexedCategories
               )
            }
         }

         const reindexedTags = await this.indexMetadata.extractMetadataForFile(
            updatedFile,
            MetadataTypes.Tags
         )

         if (tags && reindexedTags) {
            if (this.arrayUtils.changesExist(tags, reindexedTags)) {
               await meridianIndexCrud.updateMeridianEntryProperty(
                  MetadataTypes.Tags,
                  existingEntry.fullPath,
                  reindexedTags
               )
            }
         }

         const reindexedOutlinks = await indexHyperlinks.parseFileForLinks(
            updatedFile
         )

         if (outlinks && reindexedOutlinks) {
            if (this.arrayUtils.changesExist(outlinks, reindexedOutlinks)) {
               const linksRemoved = this.arrayUtils.elementsRemoved(
                  outlinks,
                  reindexedOutlinks
               )
               const linksAdded = this.arrayUtils.elementsAdded(
                  outlinks,
                  reindexedOutlinks
               )

               if (linksRemoved.length) {
                  for (let link of linksRemoved) {
                     if (typeof link === "string") {
                        let cleanPath =
                           this.fileSystemUtils.stripAnchorFromLink(link)
                        let inlinkTargetFile =
                           await meridianIndexCrud.getMeridianEntry(cleanPath)
                        if (inlinkTargetFile !== undefined) {
                           if (
                              inlinkTargetFile.inlinks?.includes(updatedFile)
                           ) {
                              const index =
                                 inlinkTargetFile.inlinks.indexOf(updatedFile)
                              if (index !== -1) {
                                 inlinkTargetFile.inlinks.splice(index, 1)
                              }
                           }
                        }
                     }
                  }
               }

               if (linksAdded.length) {
                  for (let link of linksAdded) {
                     if (typeof link === "string") {
                        let cleanPath =
                           this.fileSystemUtils.stripAnchorFromLink(link)
                        let inlinkTargetFile =
                           await meridianIndexCrud.getMeridianEntry(cleanPath)
                        if (
                           inlinkTargetFile !== undefined &&
                           !inlinkTargetFile.inlinks?.includes(updatedFile)
                        ) {
                           inlinkTargetFile.inlinks?.push(updatedFile)
                        }
                     }
                  }
               }

               await meridianIndexCrud.updateMeridianEntryProperty(
                  LinkTypes.Outlinks,
                  existingEntry.fullPath,
                  reindexedOutlinks
               )
            }
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
