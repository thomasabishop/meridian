import * as vscode from "vscode"
import { IMeridianEntry } from "../Meridian"
import { WorkspaceContextUtils } from "./WorkspaceContextUtils"

/**
 * CRUD operations for the Meridian index stored in the VSCode Workspace state
 */

export class MeridianIndexCrud {
   private workspaceContextUtils: WorkspaceContextUtils

   constructor(context: vscode.ExtensionContext) {
      this.workspaceContextUtils = new WorkspaceContextUtils(context)
   }

   private async readWorkspaceIndex(): Promise<
      Record<string, IMeridianEntry> | undefined
   > {
      return await this.workspaceContextUtils.readFromWorkspaceContext(
         "MERIDIAN"
      )
   }

   private async writeWorkspaceIndex(index: Record<string, IMeridianEntry>) {
      await this.workspaceContextUtils.writeToWorkspaceContext(
         "MERIDIAN",
         index
      )
   }

   public async getMeridianEntry(
      key: string
   ): Promise<IMeridianEntry | undefined> {
      const workspaceIndex = await this.readWorkspaceIndex()
      return workspaceIndex?.[key]
   }

   public async createMeridianEntry(newKey: string, payload: IMeridianEntry) {
      const workspaceIndex = await this.readWorkspaceIndex()
      if (workspaceIndex) {
         workspaceIndex[newKey] = payload
         await this.writeWorkspaceIndex(workspaceIndex)
      }
   }

   public async updateMeridianEntry(
      key: string,
      payload: IMeridianEntry
   ): Promise<void> {
      const workspaceIndex = await this.readWorkspaceIndex()
      if (workspaceIndex && key in workspaceIndex) {
         workspaceIndex[key] = payload
         await this.writeWorkspaceIndex(workspaceIndex)
      }
   }

   public async deleteMeridianEntry(key: string): Promise<void> {
      const workspaceIndex = await this.readWorkspaceIndex()
      if (workspaceIndex && key in workspaceIndex) {
         delete workspaceIndex[key]
         await this.writeWorkspaceIndex(workspaceIndex)
      }
   }

   public async getMeridianEntryProperty(
      property: keyof IMeridianEntry,
      key: string
   ): Promise<string | string[] | undefined> {
      const entry = await this.getMeridianEntry(key)
      return entry?.[property]
   }

   public async updateMeridianEntryProperty(
      property: keyof IMeridianEntry,
      key: string,
      payload: string | string[]
   ): Promise<void> {
      const entry = await this.getMeridianEntry(key)
      if (entry) {
         entry[property] = payload
         await this.updateMeridianEntry(key, entry)
      }
   }
}
