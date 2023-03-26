import { WorkspaceContextUtils } from "./../../../utils/WorkspaceContextUtils"
import { IMeridianEntry, IMeridianIndex } from "../../../main/Meridian"
import { FileSystemUtils } from "./../../../utils/FileSystemUtils"
import * as markdownLinkExtractor from "markdown-link-extractor"
import * as fs from "fs"
import * as vscode from "vscode"
import { MeridianIndexCrud } from "../../../main/MeridianIndexCrud"

export class IndexHyperlinks {
   public workspaceFiles: string[]
   private meridianIndexCrud: MeridianIndexCrud
   private workspaceContextUtils: WorkspaceContextUtils
   private fileSystemUtils = new FileSystemUtils()
   constructor(context: vscode.ExtensionContext, workspaceFiles: string[]) {
      this.workspaceFiles = workspaceFiles
      this.meridianIndexCrud = new MeridianIndexCrud(context)
      this.workspaceContextUtils = new WorkspaceContextUtils(context)
   }

   // Extract local links for a given file and attempt to sanitise (in case relative paths have been used or if the location of the linked file has subsequently changed).

   // This creates the outlink array for each file, which is used as the basis for determing inlinks

   public async parseFileForLinks(
      file: string
   ): Promise<IMeridianEntry[LinkTypes.Outlinks]> {
      const fileContents = await fs.promises.readFile(file, "utf-8")
      return (
         markdownLinkExtractor(fileContents) // array of all links
            // filtered to internal links
            .filter((link: string) => /\.(md)+$|\.(md)#/.test(link))
            .map((link: string) => this.sanitiseLink(link))
      )
   }

   // After initial workspace indexation has been completed, add or remove inlinks based on workspace events.
   public refreshInlinks(
      sourceLink: string,
      links: unknown[],
      operation?: string
   ) {
      links.map(async (link) => {
         if (typeof link === "string") {
            const cleanPath = this.fileSystemUtils.stripAnchorFromLink(link)
            const targetEntry = await this.meridianIndexCrud.getMeridianEntry(
               cleanPath
            )
            if (targetEntry) {
               // Remove existing inlinks for entry
               if (operation === "remove") {
                  if (targetEntry?.inlinks?.includes(sourceLink)) {
                     const index = targetEntry.inlinks.indexOf(sourceLink)
                     if (index !== -1) {
                        targetEntry.inlinks.splice(index, 1)
                     }
                  }
               } else {
                  // Add to existing inlinks for entry
                  if (!targetEntry?.inlinks?.includes(sourceLink)) {
                     targetEntry?.inlinks?.push(sourceLink)
                  }
               }
            }
         }
      })
   }
   // Retrieve outlinks/ inlinks for a given file from the workspace map
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

         if (typeof links !== "string") {
            links = links?.filter((link) => typeof link === "string")
            return links
         }
      }
   }

   // Check link is well-formed and corresponds to file in workspace
   private sanitiseLink(link: string): string | void {
      let output
      const baselink = this.fileSystemUtils.stripAnchorFromLink(link)
      const baseLinkExistsInWorkspace = this.workspaceFiles?.filter((file) =>
         file.includes(baselink)
      )

      if (baseLinkExistsInWorkspace.length) {
         output = baseLinkExistsInWorkspace[0]
         if (link.includes("#")) {
            output =
               baseLinkExistsInWorkspace[0] + "#" + link.match(/#(.*)/)![1]
         }
      } else {
         return
      }

      return output
   }
}
export default IndexHyperlinks

export enum LinkTypes {
   Outlinks = "outlinks",
   Inlinks = "inlinks",
}
