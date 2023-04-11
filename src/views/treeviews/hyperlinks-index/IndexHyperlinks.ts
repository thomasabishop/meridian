import { IMeridianEntry, IMeridianIndex } from "../../../main/Meridian"
import { FileSystemUtils } from "./../../../utils/FileSystemUtils"
import * as markdownLinkExtractor from "markdown-link-extractor"
import * as fs from "fs"
import { MeridianIndexCrud } from "../../../main/MeridianIndexCrud"

export interface IIndexHyperlinks {
   parseFileForLinks(file: string): Promise<IMeridianEntry[LinkTypes.Outlinks]>
   refreshInlinks(
      sourceLink: string,
      links: unknown[],
      operation?: string
   ): void
   getLinks(
      activeFile: string,
      linkType: LinkTypes
   ): Promise<
      | IMeridianEntry[LinkTypes.Outlinks]
      | IMeridianEntry[LinkTypes.Inlinks]
      | undefined
   >
}

export class IndexHyperlinks implements IIndexHyperlinks {
   public workspaceFiles: string[]
   private meridianIndexCrud: MeridianIndexCrud
   private fileSystemUtils: FileSystemUtils

   constructor(
      workspaceFiles: string[],
      meridianIndexCrud: MeridianIndexCrud,
      fileSystemUtils: FileSystemUtils
   ) {
      this.workspaceFiles = workspaceFiles
      this.meridianIndexCrud = meridianIndexCrud
      this.fileSystemUtils = fileSystemUtils
   }

   public async parseFileForLinks(
      file: string
   ): Promise<IMeridianEntry[LinkTypes.Outlinks]> {
      const fileContents = await fs.promises.readFile(file, "utf-8")
      return this.extractAndSanitiseLinks(fileContents)
   }

   public refreshInlinks(
      sourceLink: string,
      links: unknown[],
      operation?: string
   ) {
      links.forEach(async (link) => {
         if (typeof link === "string") {
            await this.updateInlinks(sourceLink, link, operation)
         }
      })
   }

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

   private async updateInlinks(
      sourceLink: string,
      link: string,
      operation?: string
   ) {
      const cleanPath = this.fileSystemUtils.stripAnchorFromLink(link)
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

   private removeInlink(sourceLink: string, targetEntry: IMeridianEntry) {
      if (!targetEntry.inlinks) {
         targetEntry.inlinks = []
      }
      const index = targetEntry.inlinks.indexOf(sourceLink)
      if (index !== -1) {
         targetEntry.inlinks.splice(index, 1)
      }
   }

   private addInlink(sourceLink: string, targetEntry: IMeridianEntry) {
      if (!targetEntry.inlinks) {
         targetEntry.inlinks = []
      }
      if (!targetEntry.inlinks.includes(sourceLink)) {
         targetEntry.inlinks.push(sourceLink)
      }
   }

   private extractAndSanitiseLinks(
      fileContents: string
   ): IMeridianEntry[LinkTypes.Outlinks] {
      return markdownLinkExtractor(fileContents)
         .filter((link: string) => /\.(md)+$|\.(md)#/.test(link))
         .map((link: string) => this.sanitiseLink(link))
         .filter(
            (link: string | void) => link !== undefined
         ) as IMeridianEntry[LinkTypes.Outlinks]
   }

   private sanitiseLink(link: string): string | void {
      const baselink = this.fileSystemUtils.stripAnchorFromLink(link)
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
}

export default IndexHyperlinks

export enum LinkTypes {
   Outlinks = "outlinks",
   Inlinks = "inlinks",
}
