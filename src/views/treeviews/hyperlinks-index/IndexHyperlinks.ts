import { CustomTypeGuards } from "./../../../types/CustomTypeGuards"
import { FileSystemUtils } from "./../../../utils/FileSystemUtils"
import * as markdownLinkExtractor from "markdown-link-extractor"
import * as fs from "fs"
import * as vscode from "vscode"
import IWorkspaceMap from "../../../types/IWorkspaceMap"

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

   // Retrieve outlinks for a single file, from the existing workspace map

   public async retrieveLinks(
      activeFile: string,
      linkType: LinkTypes
   ): Promise<
      IWorkspaceMap["outlinks"] | IWorkspaceMap["inlinks"] | undefined
   > {
      if (activeFile !== undefined) {
         const links =
            await this.workspaceContextUtils.retrieveWorkspaceMapEntryProp(
               linkType,
               activeFile
            )
         if (
            links !== undefined &&
            typeof links !== "string" &&
            this.customTypeGuards.isStringArray(links)
         ) {
            return links
         }
      }
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

   // Extract local links from MD file, reconstruct as absolute links, filter-out links to non-existent files

   public async parseFileForLinks(
      file: string
   ): Promise<IWorkspaceMap["outlinks"]> {
      const fileContents = await fs.promises.readFile(file, "utf-8")
      return (
         markdownLinkExtractor(fileContents) // array of all links
            // filtered to internal links
            .filter((link: string) => /\.(md)+$|\.(md)#/.test(link))
            .map((link: string) => this.sanitiseLink(link))
      )
   }

   public generateInlinks(workspaceMap: IWorkspaceMap[]): IWorkspaceMap[] {
      for (const entry of workspaceMap) {
         if (entry.outlinks) {
            for (const outlink of entry.outlinks) {
               if (outlink !== undefined) {
                  let matchedEntry = workspaceMap.find(
                     (x) =>
                        x.fullPath ===
                        this.fileSystemUtils.stripAnchorFromLink(outlink)
                  )
                  if (matchedEntry !== undefined) {
                     matchedEntry.inlinks?.push(entry.fullPath)
                  }
               }
            }
         }
      }
      return workspaceMap
   }

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
