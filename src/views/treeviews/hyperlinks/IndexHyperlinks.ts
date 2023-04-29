import { IMeridianEntry, IMeridianIndex } from "../../../Meridian"
import { FileSystemUtils } from "../../../utils/FileSystemUtils"
import * as markdownLinkExtractor from "markdown-link-extractor"
import * as fs from "fs"
import { MeridianIndexCrud } from "../../../utils/MeridianIndexCrud"

export enum LinkTypes {
   Outlinks = "outlinks",
   Inlinks = "inlinks",
}

export class IndexHyperlinks {
   private meridianIndexCrud: MeridianIndexCrud
   public workspaceFiles: string[]

   constructor(workspaceFiles: string[], meridianIndexCrud: MeridianIndexCrud) {
      this.workspaceFiles = workspaceFiles
      this.meridianIndexCrud = meridianIndexCrud
   }

   /**
    * Updates the inlinks of a specified entry in the Meridian index by either adding or removing the source link.
    * An inlink represents a connection from one entry to another.
    *
    * @param sourceLink - The source link from which the inlink originates.
    * @param link - The target link to which the inlink points.
    * @param operation - Optional string parameter specifying the operation to perform: "remove" to remove the inlink, if no value specified: add the inlink.
    */

   private async updateInlinks(
      sourceLink: string,
      link: string,
      operation?: string
   ): Promise<void> {
      const cleanPath = this.stripAnchorFromLink(link)
      const targetEntry = await this.meridianIndexCrud.getMeridianEntry(
         cleanPath
      )
      if (targetEntry) {
         if (operation === "remove") {
            this.removeInlink(sourceLink, targetEntry)
         } else {
            this.addInlink(sourceLink, targetEntry)
         }
      }
   }

   /**
    * Removes an inlink from the specified entry in the Meridian index, if it exists.
    *
    * @param sourceLink - The source link from which the inlink originates.
    * @param targetEntry - The target entry object (IMeridianEntry) to which the inlink points.
    */

   private removeInlink(sourceLink: string, targetEntry: IMeridianEntry): void {
      if (!targetEntry.inlinks) {
         targetEntry.inlinks = []
      }
      const index = targetEntry.inlinks.indexOf(sourceLink)
      if (index !== -1) {
         targetEntry.inlinks.splice(index, 1)
      }
   }

   /**
    * Adds an inlink to the specified entry in the Meridian index, if it exists.
    *
    * @param sourceLink - The source link from which the inlink originates.
    * @param targetEntry - The target entry object (IMeridianEntry) to which the inlink points.
    */

   private addInlink(sourceLink: string, targetEntry: IMeridianEntry): void {
      if (!targetEntry.inlinks) {
         targetEntry.inlinks = []
      }
      if (!targetEntry.inlinks.includes(sourceLink)) {
         targetEntry.inlinks.push(sourceLink)
      }
   }

   /**
    * Extract links from a markdown file that link to other markdown files, links may be invalid, i.e broken, or not corresponding to file in the workspace
    * @param fileContents - The contents of a markdown file
    */

   private extractRawLinks(fileContents: string): string[] {
      return markdownLinkExtractor(fileContents).filter((link: string) =>
         /\.(md)+$|\.(md)#/.test(link)
      )
   }

   /**
    * Check if local markdown link exists in the current workspace
    * @param link - The link to check for
    * @returns The full URL if link is valid, else undefined
    */

   private returnValidLink(link: string): string | undefined {
      const baselink = this.stripAnchorFromLink(link)
      const baseLinkExistsInWorkspace = this.workspaceFiles.filter((file) =>
         file.includes(baselink)
      )

      if (baseLinkExistsInWorkspace.length) {
         let output = baseLinkExistsInWorkspace[0]
         if (link.includes("#")) {
            output =
               baseLinkExistsInWorkspace[0] + "#" + link.match(/#(.*)/)![1]
         }
         return output
      }
   }

   /**
    * For each link in array returned by @method extractRawLinks, check if valid using @method returnValidLink
    * @param fileContents
    * @returns Array of valid links
    */

   private returnValidLinks(
      fileContents: string
   ): IMeridianEntry[LinkTypes.Outlinks] {
      const links = this.extractRawLinks(fileContents)
      return links.reduce((cleanLinks: string[], link: string) => {
         const cleanLink = this.returnValidLink(link)
         if (cleanLink !== undefined) {
            cleanLinks.push(cleanLink)
         }
         return cleanLinks
      }, [])
   }

   private stripAnchorFromLink(link: string): string {
      return link.includes("#") ? link.split("#")[0] : link
   }

   /**
    * Read contents of markdown file, extract links, parse those that are valid
    * @param file - A markdown file in the workspace
    * @returns Array of valid links
    */

   public async processLinks(
      file: string
   ): Promise<IMeridianEntry[LinkTypes.Outlinks]> {
      const fileContents = await fs.promises.readFile(file, "utf-8")
      return this.returnValidLinks(fileContents)
   }

   /**
    * Repopulate inlink array in response to user and editor events.
    * For example, if a workspace file is deleted, remove it as an inlink for other files in the index
    * @param sourceLink - A resource in workspace that has undergone change (rename, delete, save etc.)
    * @param links - Links to which @param sourceLink is an inlink
    * @param operation? - Delete or update the changed resource
    */

   public refreshInlinks(
      sourceLink: string,
      links: unknown[],
      operation?: string
   ): Promise<void[]> {
      const updateInlinksPromises = links.map(async (link) => {
         if (typeof link === "string") {
            await this.updateInlinks(sourceLink, link, operation)
         }
      })
      return Promise.all(updateInlinksPromises)
   }

   /**
    * Return inlinks or outlinks for a given file in the workspace
    * @param activeFile - File to return links for
    * @param linkType - One of enum LinkTypes
    */

   public async getLinks(
      activeFile: string,
      linkType: LinkTypes
   ): Promise<
      | IMeridianEntry[LinkTypes.Outlinks]
      | IMeridianEntry[LinkTypes.Inlinks]
      | undefined
   > {
      if (activeFile !== undefined) {
         let links = await this.meridianIndexCrud.getMeridianEntryProperty(
            linkType,
            activeFile
         )
         return Array.isArray(links)
            ? links.filter((link) => typeof link === "string")
            : undefined
      }
   }
}

export default IndexHyperlinks
