import * as fs from "fs"
import * as yamlFrontMatter from "yaml-front-matter"
import * as vscode from "vscode"
import { WorkspaceContextUtils } from "./../../../utils/WorkspaceContextUtils"
import { IMeridianEntry } from "../../../Meridian"

/**
 * Create indices of Markdown frontmatter.
 */

export class IndexMetadata {
   private workspaceContextUtils: WorkspaceContextUtils
   constructor(context: vscode.ExtensionContext) {
      this.workspaceContextUtils = new WorkspaceContextUtils(context)
   }

   public async collateAllMetadataOfType(
      metadataType: MetadataTypes
   ): Promise<IMetadataMap[]> {
      const meridianIndex =
         await this.workspaceContextUtils.readFromWorkspaceContext("MERIDIAN")
      let metadataMap: IMetadataMap[] = []

      if (meridianIndex !== undefined) {
         for (const [key, value] of Object.entries(meridianIndex)) {
            let type =
               metadataType === MetadataTypes.Categories
                  ? value.categories
                  : value.tags
            if (type !== undefined) {
               for (const instance of type) {
                  if (!metadataMap.some((x) => x.token === instance)) {
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
                     metadataMap
                        .filter((x) => x.token === instance)[0]
                        .files.push({
                           filePath: key,
                           fileTitle: value?.title,
                        })
                  }
               }
            }
         }
      }
      return metadataMap
   }

   public async extractMetadataForFile(
      markdownFile: string,
      metadatumType: MetadataTypes
   ): Promise<
      | IMeridianEntry[MetadataTypes.Categories]
      | IMeridianEntry[MetadataTypes.Tags]
   > {
      const fileContents = await fs.promises.readFile(markdownFile, "utf-8")
      let metadata = yamlFrontMatter.loadFront(fileContents)[metadatumType]
      if (metadata == null) {
         return
      }
      return metadata
   }
}

export default interface IMetadataMap {
   token: string
   files: {
      filePath: string
      fileTitle?: string | undefined
   }[]
}

export enum MetadataTypes {
   Categories = "categories",
   Tags = "tags",
}
