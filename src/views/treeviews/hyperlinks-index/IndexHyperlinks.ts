import { IMeridianEntry } from "./../../../utils/WorkspaceUtils"
import { CustomTypeGuards } from "../../../utils/CustomTypeGuards"
import { FileSystemUtils } from "./../../../utils/FileSystemUtils"
import * as markdownLinkExtractor from "markdown-link-extractor"
import * as fs from "fs"
import * as vscode from "vscode"
import { IMeridianIndex } from "./../../../utils/WorkspaceUtils"
import { WorkspaceContextUtils } from "./../../../utils/WorkspaceContextUtils"

export class IndexHyperlinks {
   public workspaceFiles: string[]
   private workspaceContextUtils: WorkspaceContextUtils
   private fileSystemUtils = new FileSystemUtils()
   private customTypeGuards = new CustomTypeGuards()
   constructor(context: vscode.ExtensionContext, workspaceFiles: string[]) {
      this.workspaceContextUtils = new WorkspaceContextUtils(context)
      this.workspaceFiles = workspaceFiles
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
         const links =
            await this.workspaceContextUtils.getMeridianEntryProperty(
               linkType,
               activeFile
            )
         if (
            links !== undefined &&
            typeof links !== "string" && //why is this check necessary?
            this.customTypeGuards.isStringArray(links)
         ) {
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

   public generateInlinks(meridianIndex: IMeridianIndex): IMeridianIndex {
      for (const entry in meridianIndex) {
         let outlinks = meridianIndex[entry]?.outlinks

         if (outlinks) {
            for (const outlink of outlinks) {
               if (outlink !== undefined) {
                  let linkTarget =
                     this.fileSystemUtils.stripAnchorFromLink(outlink)
                  if (meridianIndex.hasOwnProperty(linkTarget)) {
                     meridianIndex[linkTarget].inlinks?.push(
                        meridianIndex[entry].fullPath
                     )
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
