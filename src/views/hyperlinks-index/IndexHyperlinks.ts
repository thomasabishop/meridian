import * as markdownLinkExtractor from "markdown-link-extractor"
import * as fs from "fs"

export class IndexHyperlinks {
   private workspaceFiles: string[] | undefined

   constructor(workspaceFiles: string[]) {
      this.workspaceFiles = workspaceFiles
   }

   public async returnOutlinks() {
      // Problem is I'm just giving the file reference not the file contents!
      let outlinks: any[] = []
      if (this.workspaceFiles !== undefined) {
         for (const file of this.workspaceFiles) {
            let links = await this.parseFileForLinks(file)
            links.length && outlinks.push([...links])
         }
      }

      console.log(outlinks)
   }

   private async parseFileForLinks(file: string) {
      const fileContents = await fs.promises.readFile(file, "utf-8")
      const links = markdownLinkExtractor(fileContents)
      return links.filter((link: string) => /\.(md)+$|\.(md)#/.test(link))
      // https://stackoverflow.com/questions/45798453/relative-url-to-absolute-url-in-nodejs
      // return markdownLinkExtractor(fileContents)
   }

   private sanitiseHyperlinks() {
      // Run outlinks array through a switch statement to remove
      //  - external URLs
      //  - think about how to parse relative links, is there a vscode API method ?
   }
}

export default IndexHyperlinks
