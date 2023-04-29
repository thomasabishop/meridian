import { ArrayUtils } from "./utils/ArrayUtils"
import { IndexHyperlinks } from "./views/treeviews/hyperlinks/IndexHyperlinks"
import { MeridianIndexCrud } from "./utils/MeridianIndexCrud"
import { WorkspaceContextUtils } from "./utils/WorkspaceContextUtils"
import * as vscode from "vscode"
import { FileSystemUtils } from "./utils/FileSystemUtils"

import {
   IndexMetadata,
   MetadataTypes,
} from "./views/treeviews/metadata/IndexMetadata"

import { printChannelOutput } from "./helpers/logger"
import { LinkTypes } from "./views/treeviews/hyperlinks/IndexHyperlinks"

export class Meridian {
   private context: vscode.ExtensionContext
   private workspaceFiles: string[]
   private workspaceContextUtils: WorkspaceContextUtils
   private indexHyperlinks: IndexHyperlinks
   private indexMetadata: IndexMetadata
   private fileSystemUtils: FileSystemUtils
   private arrayUtils: ArrayUtils

   constructor(
      context: vscode.ExtensionContext,
      workspaceFiles: string[],
      workspaceContextUtils: WorkspaceContextUtils,
      indexHyperlinks: IndexHyperlinks,
      indexMetadata: IndexMetadata,
      fileSystemUtils: FileSystemUtils,
      arrayUtils: ArrayUtils
   ) {
      this.context = context
      this.workspaceFiles = workspaceFiles
      this.workspaceContextUtils = workspaceContextUtils
      this.indexHyperlinks = indexHyperlinks
      this.indexMetadata = indexMetadata
      this.fileSystemUtils = fileSystemUtils
      this.arrayUtils = arrayUtils
   }

   public async indexWorkspace(): Promise<void> {
      try {
         let meridianIndex: IMeridianIndex = {}
         for (const file of this.workspaceFiles) {
            let outlinks = await this.indexHyperlinks.processLinks(file)

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
         this.workspaceContextUtils
            .writeToWorkspaceContext("MERIDIAN", meridianIndex)
            .then(async () => {
               const index =
                  await this.workspaceContextUtils.readFromWorkspaceContext(
                     "MERIDIAN"
                  )
               if (index) {
                  for (const entry of Object.values(index)) {
                     if (
                        entry &&
                        this.arrayUtils.isStringArray(entry.outlinks)
                     ) {
                        this.indexHyperlinks.refreshInlinks(
                           entry.fullPath,
                           entry.outlinks
                        )
                     }
                  }
               }
            })
      } catch (err) {
         printChannelOutput(`${err}`, true, "error")
         // } finally {
         //    if (allFiles !== undefined) {
         //       printChannelOutput(`${allFiles.length} files indexed`, false)
         //    }
      }
   }

   // Reindex an existing file or, if a file is not yet indexed, add it as an entry to the Meridian index
   public async indexWorkspaceFile(updatedFile: string): Promise<void> {
      const meridianIndex =
         await this.workspaceContextUtils.readFromWorkspaceContext("MERIDIAN")
      const allEntries = meridianIndex && Object.keys(meridianIndex)
      const meridianIndexCrud = new MeridianIndexCrud(this.context)

      const indexHyperlinks =
         allEntries && new IndexHyperlinks(allEntries, meridianIndexCrud)

      const existingEntry = await meridianIndexCrud.getMeridianEntry(
         updatedFile
      )
      const reindexedCategories =
         await this.indexMetadata.extractMetadataForFile(
            updatedFile,
            MetadataTypes.Categories
         )

      const reindexedTags = await this.indexMetadata.extractMetadataForFile(
         updatedFile,
         MetadataTypes.Tags
      )

      const reindexedOutlinks =
         indexHyperlinks && (await indexHyperlinks.processLinks(updatedFile))

      // If entry already exists for workspace file, update properties
      if (existingEntry) {
         const { categories, tags, outlinks } = existingEntry
         if (categories && reindexedCategories) {
            if (this.arrayUtils.changesExist(categories, reindexedCategories)) {
               await meridianIndexCrud.updateMeridianEntryProperty(
                  MetadataTypes.Categories,
                  existingEntry.fullPath,
                  reindexedCategories
               )
            }
         }

         if (tags && reindexedTags) {
            if (this.arrayUtils.changesExist(tags, reindexedTags)) {
               await meridianIndexCrud.updateMeridianEntryProperty(
                  MetadataTypes.Tags,
                  existingEntry.fullPath,
                  reindexedTags
               )
            }
         }

         if (outlinks && reindexedOutlinks) {
            if (this.arrayUtils.changesExist(outlinks, reindexedOutlinks)) {
               // Determine changes to outlink array, then update inlinks to reflect changes
               const linksRemoved = this.arrayUtils.elementsRemoved(
                  outlinks,
                  reindexedOutlinks
               )
               const linksAdded = this.arrayUtils.elementsAdded(
                  outlinks,
                  reindexedOutlinks
               )

               if (linksRemoved.length) {
                  indexHyperlinks.refreshInlinks(
                     updatedFile,
                     linksRemoved,
                     "remove"
                  )
               }

               if (linksAdded.length) {
                  indexHyperlinks.refreshInlinks(updatedFile, linksAdded)
               }

               // Update outlinks array
               await meridianIndexCrud.updateMeridianEntryProperty(
                  LinkTypes.Outlinks,
                  existingEntry.fullPath,
                  reindexedOutlinks
               )
            }
         }
      } else {
         // Create a new entry for file
         const newEntry: IMeridianEntry = {
            fullPath: updatedFile,
            title: this.fileSystemUtils.parseFileTitle(updatedFile),
            categories: reindexedCategories,
            tags: reindexedTags,
            outlinks: reindexedOutlinks,
            inlinks: [],
         }

         meridianIndexCrud
            .createMeridianEntry(updatedFile, newEntry)
            .then(
               () =>
                  reindexedOutlinks &&
                  indexHyperlinks.refreshInlinks(updatedFile, reindexedOutlinks)
            )
      }
   }

   // When a deletion or rename event occurs, remove references to these entries and their metadate from the Meridian index
   public async removeEntries(deletedEntries: string[]): Promise<void> {
      const meridianIndexCrud = new MeridianIndexCrud(this.context)
      const meridianIndex =
         await this.workspaceContextUtils.readFromWorkspaceContext("MERIDIAN")
      const allEntries = meridianIndex && Object.keys(meridianIndex)
      const indexHyperlinks =
         allEntries && new IndexHyperlinks(allEntries, meridianIndexCrud)

      for (const entry of deletedEntries) {
         const existingEntry = await meridianIndexCrud.getMeridianEntry(entry)
         if (existingEntry && indexHyperlinks) {
            if (existingEntry?.outlinks) {
               indexHyperlinks.refreshInlinks(
                  entry,
                  existingEntry?.outlinks,
                  "remove"
               )
            }
            meridianIndexCrud.deleteMeridianEntry(entry)
         }
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
