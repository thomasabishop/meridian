import * as fs from "fs"
import * as yamlFrontMatter from "yaml-front-matter"
import * as vscode from "vscode"
import { WorkspaceContextUtils } from "../../../utils/WorkspaceContextUtils"
import { IMeridianEntry, IMeridianIndex } from "../../../Meridian"
import { printChannelOutput } from "../../../helpers/logger"

/**
 * Create indices of Markdown frontmatter.
 */

// TODO: use dependency injection, don't instantiate in the constructor

export enum MetadataTypes {
   Categories = "categories",
   Tags = "tags",
}

export default interface IMetadatumIndex {
   token: string
   files: {
      filePath: string
      fileTitle?: string | undefined
   }[]
}

export class IndexMetadata {
   private workspaceContextUtils: WorkspaceContextUtils
   constructor(context: vscode.ExtensionContext) {
      this.workspaceContextUtils = new WorkspaceContextUtils(context)
   }

   private updateMetadataMap(
      metadataMap: IMetadatumIndex[],
      token: string,
      filePath: string,
      file: Pick<IMeridianEntry, "title" | "categories" | "tags">
   ): void {
      const existingEntry = metadataMap.find((x) => x.token === token)

      if (!existingEntry) {
         metadataMap.push({
            token: token,
            files: [
               {
                  filePath: filePath,
                  fileTitle: file?.title,
               },
            ],
         })
      } else {
         existingEntry.files.push({
            filePath: filePath,
            fileTitle: file?.title,
         })
      }
   }

   public async collateAllMetadataOfType(metadataType: MetadataTypes): Promise<IMetadatumIndex[]> {
      const meridianIndex: IMeridianIndex | undefined =
         await this.workspaceContextUtils.readFromWorkspaceContext("MERIDIAN")
      let metadataMap: IMetadatumIndex[] = []

      if (meridianIndex !== undefined) {
         for (const [key, value] of Object.entries(meridianIndex)) {
            let type: string[] | undefined

            switch (metadataType) {
               case MetadataTypes.Categories:
                  type = value.categories
                  break
               case MetadataTypes.Tags:
                  type = value.tags
                  break
            }

            if (type !== undefined) {
               for (const token of type) {
                  this.updateMetadataMap(metadataMap, token, key, value)
               }
            }
         }
      }
      return metadataMap
   }

   public async extractMetadataForFile(
      markdownFile: string,
      metadatumType: MetadataTypes
   ): Promise<IMeridianEntry["categories" | "tags"]> {
      const fileContents = await fs.promises.readFile(markdownFile, "utf-8")
      const frontMatter = yamlFrontMatter.loadFront(fileContents)

      if (MetadataTypes.Categories in frontMatter || MetadataTypes.Tags in frontMatter) {
         const metadata = yamlFrontMatter.loadFront(fileContents)[metadatumType]
         return metadata ?? undefined
      }
   }
}
