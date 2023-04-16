import * as fs from "fs"
import * as yamlFrontMatter from "yaml-front-matter"
import * as vscode from "vscode"
import { WorkspaceContextUtils } from "./../../../utils/WorkspaceContextUtils"
import { IMeridianEntry, IMeridianIndex } from "../../../Meridian"

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
      instance: string,
      key: string,
      value: Pick<IMeridianEntry, "title" | "categories" | "tags">
   ) {
      const existingEntry = metadataMap.find((x) => x.token === instance)

      if (!existingEntry) {
         metadataMap.push({
            token: instance,
            files: [
               {
                  filePath: key,
                  fileTitle: value?.title,
               },
            ],
         })
      } else {
         existingEntry.files.push({
            filePath: key,
            fileTitle: value?.title,
         })
      }
   }

   public async collateAllMetadataOfType(
      metadataType: MetadataTypes
   ): Promise<IMetadatumIndex[]> {
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
               for (const instance of type) {
                  this.updateMetadataMap(metadataMap, instance, key, value)
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
      const metadata = yamlFrontMatter.loadFront(fileContents)[metadatumType]
      return metadata ?? undefined
   }
}
