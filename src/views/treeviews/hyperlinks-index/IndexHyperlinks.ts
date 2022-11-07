import * as markdownLinkExtractor from "markdown-link-extractor"
import * as fs from "fs"
import * as vscode from "vscode"
import IWorkspaceMap from "../../../types/IWorkspaceMap"

import { WorkspaceContextUtils } from "./../../../utils/WorkspaceContextUtils"

export class IndexHyperlinks {
   private workspaceContextUtils: WorkspaceContextUtils
   public workspaceFiles: string[]

   constructor(context: vscode.ExtensionContext, workspaceFiles: string[]) {
      this.workspaceContextUtils = new WorkspaceContextUtils(context)
      this.workspaceFiles = workspaceFiles
   }

   public async indexOutlinks(
      activeFile: string
   ): Promise<IWorkspaceMap["outlinks"] | undefined> {
      if (activeFile !== undefined) {
         let meridianMap =
            await this.workspaceContextUtils.readFromWorkspaceContext(
               "MERIDIAN"
            )
         return meridianMap?.get(activeFile)?.outlinks ?? undefined
      }
   }

   public async indexInlinks(
      activeFile: string
   ): Promise<string[] | undefined> {
      if (activeFile !== undefined) {
         let inlinks: string[] = []
         let meridianMap =
            await this.workspaceContextUtils.readFromWorkspaceContext(
               "MERIDIAN"
            )

         meridianMap?.forEach((value, key) => {
            if (value.outlinks?.includes(activeFile) && inlinks !== undefined) {
               inlinks.push(key)
            }
         })

         return inlinks
      }
   }

   // Extract local links from MD file, reconstruct as absolute links, filter-out links to non-existent files:

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

   // Check link is well-formed and corresponds to document in workspace
   private sanitiseLink(link: string): string | void {
      let output
      const baselink = this.stripToBaseLink(link)
      const baseLinkExistsInWorkspace = this.workspaceFiles?.filter((file) =>
         file.includes(baselink)
      )

      if (baseLinkExistsInWorkspace.length) {
         output = baseLinkExistsInWorkspace[0]
         if (this.linkContainsFragment(link)) {
            output =
               baseLinkExistsInWorkspace[0] + "#" + link.match(/#(.*)/)![1]
         }
      } else {
         return
      }

      return output
   }

   // Remove relative path tokens (eg. `../`, `././` etc) and anchor fragments:
   private stripToBaseLink(link: string): string {
      return this.linkContainsFragment(link) ? link.split("#")[0] : link
   }

   // Identify whether link contains anchor fragment:
   // e.g /files/doc.md#section-one

   private linkContainsFragment(link: string): boolean {
      return link.includes("#")
   }
}
export default IndexHyperlinks
