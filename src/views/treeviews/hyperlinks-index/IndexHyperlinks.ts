import * as markdownLinkExtractor from "markdown-link-extractor"
import * as fs from "fs"
import * as vscode from "vscode"
import { IWorkspaceMap } from "../../../utils/WorkspaceUtils"
import { WorkspaceContextUtils } from "./../../../utils/WorkspaceContextUtils"

export class IndexHyperlinks {
   private workspaceContextUtils: WorkspaceContextUtils
   private workspaceFiles: string[]

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
      return markdownLinkExtractor(fileContents)
         .filter((link: string) => /\.(md)+$|\.(md)#/.test(link))
         .map((link: string) => this.sanitiseHyperlinks(link))
         .filter((link: string | undefined) => link !== undefined)
   }

   // Clean-up relative links that bugger up the vscode Uri, by matching against file index:

   private sanitiseHyperlinks(link: string): string | void {
      const parseData = {
         link:
            this.workspaceFiles?.filter((file) =>
               file.includes(this.stripToBaseLink(link))
            )[0] || undefined,
         fragment: this.linkContainsFragment(link)
            ? link.match(/#(.*)/)![1]
            : undefined,
      }

      if (parseData?.link === undefined) {
         return
      }

      return parseData.fragment === undefined
         ? parseData.link
         : parseData.link + "#" + parseData.fragment
   }

   // Remove relative path tokens (eg. `../`, `././` etc) and anchor fragments:

   private stripToBaseLink(link: string): string {
      link = vscode.Uri.file(link)?.path.replace(/^(?:\.\.\/)+/, "")
      return this.linkContainsFragment(link) ? link.split("#")[0] : link
   }

   // Identify whether link contains anchor fragment:
   // e.g /files/doc.md#section-one

   private linkContainsFragment(link: string): boolean {
      return link.includes("#")
   }
}
export default IndexHyperlinks
