import { ArrayUtils } from "./utils/ArrayUtils"
import { IndexHyperlinks } from "./views/treeviews/hyperlinks/IndexHyperlinks"
import { MeridianIndexCrud } from "./utils/MeridianIndexCrud"
import { WorkspaceContextUtils } from "./utils/WorkspaceContextUtils"
import { FileSystemUtils } from "./utils/FileSystemUtils"
import { IndexMetadata, MetadataTypes } from "./views/treeviews/metadata/IndexMetadata"
import { LinkTypes } from "./views/treeviews/hyperlinks/IndexHyperlinks"
import { printChannelOutput } from "./helpers/logger"

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

export class Meridian {
   private workspaceFiles: string[]
   private workspaceContextUtils: WorkspaceContextUtils
   private indexHyperlinks: IndexHyperlinks
   private indexMetadata: IndexMetadata
   private fileSystemUtils: FileSystemUtils
   private arrayUtils: ArrayUtils
   private meridianIndexCrud: MeridianIndexCrud
   private unindexableFiles: number = 0
   private indexedFiles: number = 0
   private unindexedFiles: string[] = []
   constructor(
      workspaceFiles: string[],
      workspaceContextUtils: WorkspaceContextUtils,
      indexHyperlinks: IndexHyperlinks,
      indexMetadata: IndexMetadata,
      fileSystemUtils: FileSystemUtils,
      arrayUtils: ArrayUtils,
      meridianIndexCrud: MeridianIndexCrud
   ) {
      this.workspaceFiles = workspaceFiles
      this.workspaceContextUtils = workspaceContextUtils
      this.indexHyperlinks = indexHyperlinks
      this.indexMetadata = indexMetadata
      this.fileSystemUtils = fileSystemUtils
      this.arrayUtils = arrayUtils
      this.meridianIndexCrud = meridianIndexCrud
   }

   private async extractMetadata(
      file: string,
      type: MetadataTypes,
      existingData: string[] = []
   ): Promise<string[]> {
      const result = await this.indexMetadata.extractMetadataForFile(file, type)
      return existingData.length > 0 ? existingData : result || []
   }

   private async processLinks(file: string, existingLinks: string[]): Promise<string[]> {
      return existingLinks.length > 0
         ? existingLinks
         : [...new Set(await this.indexHyperlinks.processLinks(file))]
   }

   /**
    * A file is indexable if it contains at least one instance of Meridian metadata
    */
   private isFileIndexable(
      categories: string[],
      tags: string[],
      outlinks: string[]
   ): boolean {
      return categories.length > 0 || tags.length > 0 || outlinks.length > 0
   }

   private recordUnindexedFile(file: string): void {
      this.unindexedFiles.push(this.fileSystemUtils.prettifyFileName(file))
      this.unindexableFiles++
   }

   private createMeridianEntry(
      file: string,
      categories: string[],
      tags: string[],
      outlinks: string[]
   ): IMeridianEntry {
      return {
         fullPath: file,
         title: this.fileSystemUtils.parseFileTitle(file),
         categories: categories,
         tags: tags,
         outlinks: outlinks,
         inlinks: [],
      }
   }

   /**
    * If indexable data exists, create Meridian entry (IMeridianEntry)
    *
    * @param file - File path to generate entry for.
    * @param categories - Optional; extracted from file if not provided.
    * @param tags - Optional; extracted from file if not provided.
    * @param outlinks - Optional; extracted from file if not provided.
    * @returns A promise resolving to an IMeridianEntry object with the generated entry.
    */

   private async generateEntry(
      file: string,
      categories: string[] = [],
      tags: string[] = [],
      outlinks: string[] = []
   ): Promise<IMeridianEntry | null> {
      categories = await this.extractMetadata(file, MetadataTypes.Categories, categories)
      tags = await this.extractMetadata(file, MetadataTypes.Tags, tags)
      outlinks = await this.processLinks(file, outlinks)

      if (!this.isFileIndexable(categories, tags, outlinks)) {
         this.recordUnindexedFile(file)
         return null
      }

      this.indexedFiles++
      return this.createMeridianEntry(file, categories, tags, outlinks)
   }

   /**
    * Updates a specific property of an existing Meridian entry if there are changes.
    *
    * @param type - The type of property to update, either MetadataTypes or LinkTypes.
    * @param oldPropertyValues
    * @param newPropertyValues
    * @param fullPath
    * @returns A promise that resolves when the property has been updated, if necessary.
    */

   private async updateExistingEntryProperty(
      type: MetadataTypes | LinkTypes,
      oldPropertyValues: string[] | undefined,
      newPropertyValues: string[] | undefined,
      fullPath: string
   ): Promise<void> {
      if (
         this.arrayUtils.changesExist(oldPropertyValues ?? [], newPropertyValues ?? [])
      ) {
         await this.meridianIndexCrud.updateMeridianEntryProperty(
            type,
            fullPath,
            newPropertyValues || []
         )
      }
   }

   /**
    * Updates an existing Meridian entry with new metadata and link properties.
    *
    * @param existingEntry - The existing IMeridianEntry object to be updated
    * @param reindexedCategories
    * @param reindexedTags
    * @param reindexedOutlinks
    * @returns A promise that resolves when the existing Meridian entry has been updated.
    */

   private async updateExistingEntry(
      existingEntry: IMeridianEntry,
      reindexedCategories: string[],
      reindexedTags: string[],
      reindexedOutlinks: string[]
   ): Promise<void> {
      const { fullPath, categories, tags, outlinks } = existingEntry

      // Update metadata for the update entry
      await this.updateExistingEntryProperty(
         MetadataTypes.Categories,
         categories,
         reindexedCategories,
         fullPath
      )
      await this.updateExistingEntryProperty(
         MetadataTypes.Tags,
         tags,
         reindexedTags,
         fullPath
      )

      // Update entries that maintain links to the updated existing entry...
      if (this.arrayUtils.changesExist(outlinks ?? [], reindexedOutlinks ?? [])) {
         const linksRemoved = this.arrayUtils.elementsRemoved(
            outlinks ?? [],
            reindexedOutlinks ?? []
         )
         const linksAdded = this.arrayUtils.elementsAdded(
            outlinks ?? [],
            reindexedOutlinks ?? []
         )

         if (linksRemoved.length) {
            this.indexHyperlinks.refreshInlinks(fullPath, linksRemoved, "remove")
         }

         if (linksAdded.length) {
            this.indexHyperlinks.refreshInlinks(fullPath, linksAdded)
         }

         // Update outlinks for the updated entry
         await this.updateExistingEntryProperty(
            LinkTypes.Outlinks,
            outlinks,
            reindexedOutlinks,
            fullPath
         )
      }
   }

   /**
    * Creates a new Meridian entry and adds to VSCode Workspace Context.
    */

   private async createNewEntry(
      file: string,
      categories: string[],
      tags: string[],
      outlinks: string[]
   ): Promise<void> {
      const newEntry = await this.generateEntry(file, categories, tags, outlinks)
      if (newEntry !== null) {
         await this.meridianIndexCrud.addMeridianEntry(file, newEntry)
         outlinks && this.indexHyperlinks.refreshInlinks(file, outlinks)
      }
   }

   /**
    * Indexes the entire workspace by creating Meridian entries for each file. Once entry is created, the inlinks array for the entry is then populated, using outlink data and existing index stored in VSCode Workspace Context.
    */

   private async indexWorkspace(): Promise<void> {
      const populateEntries = this.workspaceFiles.map(async (file) => {
         try {
            const entry: IMeridianEntry | null = await this.generateEntry(file)
            return entry !== null ? { file, entry } : null
         } catch (error) {
            console.error(`Failed to generate an entry for file ${file}: `, error)
            return null
         }
      })

      const entries = await Promise.all(populateEntries)

      const validEntries = entries.filter((result) => result !== null)

      for (const result of validEntries) {
         if (result) {
            const { file, entry } = result
            await this.meridianIndexCrud.addMeridianEntry(file, entry)

            if (this.arrayUtils.isStringArray(entry.outlinks)) {
               this.indexHyperlinks.refreshInlinks(entry.fullPath, entry.outlinks)
            }
         }
      }

      printChannelOutput(
         `${entries.length} files processed: ${this.indexedFiles} were indexed, ${this.unindexableFiles} could not be indexed (${this.unindexedFiles})`,
         false
      )
   }

   /**
    * Indexes a workspace file, creating or updating its entry in the Meridian index.
    *
    * @param updatedFile - The file path of the workspace file to be indexed/reindexed.
    */

   public async indexWorkspaceFile(updatedFile: string): Promise<void> {
      const meridianIndex = await this.workspaceContextUtils.readFromWorkspaceContext(
         "MERIDIAN"
      )
      const allEntries = meridianIndex && Object.keys(meridianIndex)
      const existingEntry = await this.meridianIndexCrud.getMeridianEntry(updatedFile)

      const [reindexedCategories, reindexedTags, reindexedOutlinks] = await Promise.all([
         this.indexMetadata.extractMetadataForFile(updatedFile, MetadataTypes.Categories),
         this.indexMetadata.extractMetadataForFile(updatedFile, MetadataTypes.Tags),
         allEntries
            ? this.indexHyperlinks.processLinks(updatedFile)
            : Promise.resolve(undefined),
      ])

      await (existingEntry
         ? this.updateExistingEntry(
              existingEntry,
              reindexedCategories || [],
              reindexedTags || [],
              reindexedOutlinks || []
           )
         : this.createNewEntry(
              updatedFile,
              reindexedCategories || [],
              reindexedTags || [],
              reindexedOutlinks || []
           ))
   }

   /**
    * Removes Meridian entries and updates the inlinks of related entries.
    *
    * @param deletedEntries - An array of file paths representing the entries to be removed.
    * @returns A promise that resolves when all entries are removed and inlinks are updated.
    */

   public async removeEntries(deletedEntries: string[]): Promise<void> {
      for (const entry of deletedEntries) {
         const existingEntry = await this.meridianIndexCrud.getMeridianEntry(entry)
         if (existingEntry?.outlinks) {
            this.indexHyperlinks.refreshInlinks(entry, existingEntry?.outlinks, "remove")
         }
         this.meridianIndexCrud.deleteMeridianEntry(entry)
      }
   }

   /**
    * Create Meridian instance on extension activation
    */
   public async init() {
      return await this.indexWorkspace()
   }
}
