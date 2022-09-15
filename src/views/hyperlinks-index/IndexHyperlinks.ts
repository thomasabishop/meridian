import * as markdownLinkExtractor from "markdown-link-extractor"
import * as fs from "fs"
import * as vscode from "vscode"

export class IndexHyperlinks {
   private activeFile: string
   private readonly workspaceFiles: string[] | undefined

   constructor(activeFile: string, workspaceFiles: string[] | undefined) {
      this.activeFile = activeFile
      this.workspaceFiles = workspaceFiles
   }

   public async returnOutlinks(): Promise<string[]> {
      let outlinks: string[] = []
      if (this.activeFile !== undefined) {
         let links = await this.parseFileForLinks(this.activeFile)
         links.length && outlinks.push(...links)
      }
      return outlinks
   }

   // Extract local links from MD file, reconstruct as absolute links, filter-out links to non-existent files
   private async parseFileForLinks(file: string): Promise<string[]> {
      const fileContents = await fs.promises.readFile(file, "utf-8")
      return markdownLinkExtractor(fileContents)
         .filter((link: string) => /\.(md)+$|\.(md)#/.test(link))
         .map((link: string) => this.sanitiseHyperlinks(link))
         .filter((link: string | undefined) => link !== undefined)
   }

   // Clean-up relative links that bugger up the vscode Uri, by matching against file index
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

   // Remove relative path tokens (eg. `../`, `././` etc) and anchor fragments
   private stripToBaseLink(link: string): string {
      link = vscode.Uri.file(link)?.path.replace(/^(?:\.\.\/)+/, "")
      return this.linkContainsFragment(link) ? link.split("#")[0] : link
   }

   // Identify whether link contains anchor fragment
   // e.g /files/doc.md#section-one
   private linkContainsFragment(link: string): boolean {
      return link.includes("#")
   }
}

export default IndexHyperlinks
