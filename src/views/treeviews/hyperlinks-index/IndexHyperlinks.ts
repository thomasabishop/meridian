import { IMeridianEntry, IMeridianIndex } from "../../../main/Meridian"
import { CustomTypeGuards } from "../../../utils/CustomTypeGuards"
import { FileSystemUtils } from "./../../../utils/FileSystemUtils"
import * as markdownLinkExtractor from "markdown-link-extractor"
import * as fs from "fs"
import * as vscode from "vscode"
import { MeridianIndexCrud } from "../../../main/MeridianIndexCrud"

export class IndexHyperlinks {
   public workspaceFiles: string[]
   private meridianIndexCrud: MeridianIndexCrud
   private fileSystemUtils = new FileSystemUtils()
   private customTypeGuards = new CustomTypeGuards()
   constructor(context: vscode.ExtensionContext, workspaceFiles: string[]) {
      this.workspaceFiles = workspaceFiles
      this.meridianIndexCrud = new MeridianIndexCrud(context)
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

   // Loop through each entry in the workspace map and construct inlink array for the entry from existing outlinks array

   public collateInlinks(meridianIndex: IMeridianIndex): IMeridianIndex {
      for (const entry in meridianIndex) {
         let outlinks = meridianIndex[entry]?.outlinks

         if (outlinks) {
            for (const outlink of outlinks) {
               if (outlink !== undefined) {
                  let linkTarget =
                     this.fileSystemUtils.stripAnchorFromLink(outlink)
                  if (meridianIndex.hasOwnProperty(linkTarget)) {
                     let targetInlinks = meridianIndex[linkTarget].inlinks
                     let newInlink = meridianIndex[entry].fullPath
                     if (!targetInlinks?.includes(newInlink)) {
                        targetInlinks?.push(newInlink)
                     }
                  }
               }
            }
         }
      }

      return meridianIndex
   }
   // public async indexOutlinks(
   //    activeFile: string
   // ): Promise<IWorkspaceMap["outlinks"] | undefined> {
   //    if (activeFile !== undefined) {
   //       const outlinks =
   //          await this.workspaceContextUtils.retrieveWorkspaceMapEntryProp(
   //             "outlinks",
   //             activeFile
   //          )
   //       if (
   //          outlinks !== undefined &&
   //          this.customTypeGuards.isStringArray(outlinks)
   //       ) {
   //          return outlinks
   //       }
   //    }
   // }

   // public async indexInlinks(
   //    activeFile: string
   // ): Promise<string[] | undefined> {
   //    if (activeFile !== undefined) {
   //       const inlinks =
   //          await this.workspaceContextUtils.retrieveWorkspaceMapEntryProp(
   //             "inlinks",
   //             activeFile
   //          )

   //       if (
   //          inlinks !== undefined &&
   //          this.customTypeGuards.isStringArray(inlinks)
   //       ) {
   //          return inlinks
   //       }
   //    }
   // }

   // Check link is well-formed and corresponds to document in workspace
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
