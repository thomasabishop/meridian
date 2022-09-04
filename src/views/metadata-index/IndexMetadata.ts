import * as fs from "fs"
import * as path from "path"
import * as yamlFrontMatter from "yaml-front-matter"

/**
 * Create indices of Markdown frontmatter.
 */

export class IndexMetadata {
   private metadataType: string
   private workspaceFiles: string[] | undefined

   constructor(workspaceFiles: string[], metadataType: string) {
      this.metadataType = metadataType
      this.workspaceFiles = workspaceFiles
   }

   public async main(): Promise<IMetadataIndex[] | string | undefined> {
      let parsed: IMetadatum[] = []
      if (this.workspaceFiles === undefined) {
         return
      }
      for (const file of this.workspaceFiles) {
         let metadata = await this.parseFileFrontmatter(file)
         metadata !== undefined && parsed.push(...metadata)
      }

      return this.createMetadataIndex(parsed)
   }

   // TODO: Make this more algorithmically efficient later
   private createMetadataIndex(metadata: IMetadatum[]): IMetadataIndex[] {
      let index: IMetadataIndex[] = []
      metadata.map((metadatum: IMetadatum): void => {
         // If token exists in index, add file to its preexisting array
         // Else create new index entry for token
         !index.some((x) => x.token === metadatum.token)
            ? index.push({
                 token: metadatum.token,
                 files: [
                    {
                       filePath: metadatum.file,
                       fileTitle: metadatum.fileTitle,
                    },
                 ],
              })
            : index
                 .filter((y) => y.token === metadatum.token)[0]
                 .files.push({
                    filePath: metadatum.file,
                    fileTitle: metadatum.fileTitle,
                 })
      })
      return index
   }

   private async parseFileFrontmatter(
      markdownFile: string
   ): Promise<IMetadatum[] | undefined> {
      const fileContents = await fs.promises.readFile(markdownFile, "utf-8")

      const metadataTypeForFile =
         yamlFrontMatter.loadFront(fileContents)[this.metadataType]
      if (metadataTypeForFile === undefined || metadataTypeForFile === null) {
         // TODO: Raise VSCode toast and write unindexable file to Extension log
         return
      } else {
         return metadataTypeForFile.map((metadatumType: string) => ({
            token: metadatumType,
            file: markdownFile,
            fileTitle: this.parseFileTitle(markdownFile),
         }))
      }
   }

   private parseFileTitle(filePath: string): string {
      return path.parse(filePath).name.split("_").join(" ")
   }
}

export interface IMetadataIndex {
   token: string
   files: {
      filePath: string
      fileTitle?: string | undefined
   }[]

   // turn this into an array of object with shape `file: ..., fileTitle...`
}

interface IMetadatum {
   token: string
   file: string
   fileTitle?: string
}
