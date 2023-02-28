import * as fs from "fs"
import * as yamlFrontMatter from "yaml-front-matter"
import * as vscode from "vscode"
import IWorkspaceMap from "../../../types/IWorkspaceMap"
import { WorkspaceContextUtils } from "./../../../utils/WorkspaceContextUtils"
import IMetadataIndex from "../../../types/IMetadataIndex"

/**
 * Create indices of Markdown frontmatter.
 */

export class IndexMetadata {
   private workspaceContextUtils: WorkspaceContextUtils
   constructor(context: vscode.ExtensionContext) {
      this.workspaceContextUtils = new WorkspaceContextUtils(context)
   }

   public async collateAllMetadataOfType(
      metadataType: string
   ): Promise<IMetadataIndex[]> {
      const meridianMap =
         await this.workspaceContextUtils.readFromWorkspaceContext("MERIDIAN")
      let metadataIndex: IMetadataIndex[] = []

      meridianMap &&
         meridianMap?.forEach((value, key) => {
            let type =
               metadataType === "categories" ? value.categories : value.tags
            if (type !== undefined) {
               for (const instance of type) {
                  if (!metadataIndex.some((x) => x.token === instance)) {
                     metadataIndex.push({
                        token: instance,
                        files: [
                           {
                              filePath: key,
                              fileTitle: value?.title,
                           },
                        ],
                     })
                  } else {
                     metadataIndex
                        .filter((y) => y.token === instance)[0]
                        .files.push({
                           filePath: key,
                           fileTitle: value?.title,
                        })
                  }
               }
            }
         })
      return metadataIndex
   }

   public async extractMetadataForFile(
      markdownFile: string,
      metadatumType: string
   ): Promise<IWorkspaceMap["categories"] | IWorkspaceMap["tags"]> {
      const fileContents = await fs.promises.readFile(markdownFile, "utf-8")
      let metadata = yamlFrontMatter.loadFront(fileContents)[metadatumType]
      // eslint-disable-next-line eqeqeq
      if (metadata == null) {
         return
      }
      return metadata
   }
}
