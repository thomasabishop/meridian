import * as vscode from "vscode"
import { IMeridianEntry } from "./Meridian"
import { WorkspaceContextUtils } from "../utils/WorkspaceContextUtils"
/**
 * Methods to modify the Meridian map object stored in VSCode Workspace state
 */

export class MeridianIndexCrud {
   // private context: vscode.ExtensionContext
   private workspaceContextUtils: WorkspaceContextUtils

   constructor(context: vscode.ExtensionContext) {
      this.workspaceContextUtils = new WorkspaceContextUtils(context)
   }

   public async getMeridianEntry(
      key: string
   ): Promise<IMeridianEntry | undefined> {
      if (key !== undefined) {
         const workspaceIndex =
            await this.workspaceContextUtils.readFromWorkspaceContext(
               "MERIDIAN"
            )
         if (workspaceIndex !== undefined && key in workspaceIndex) {
            return workspaceIndex[key]
         }
      }
   }

   public async updateMeridianEntry(
      key: string,
      payload: IMeridianEntry
   ): Promise<void> {
      const workspaceIndex =
         await this.workspaceContextUtils.readFromWorkspaceContext("MERIDIAN")
      if (workspaceIndex !== undefined && key in workspaceIndex) {
         workspaceIndex[key] = payload
      }
   }

   public async deleteMeridianEntry(key: string): Promise<void> {
      const workspaceIndex =
         await this.workspaceContextUtils.readFromWorkspaceContext("MERIDIAN")
      if (workspaceIndex !== undefined && key in workspaceIndex) {
         delete workspaceIndex[key]
      }
   }

   public async getMeridianEntryProperty(
      property: keyof IMeridianEntry,
      key: string
   ): Promise<string | string[] | undefined> {
      if (key !== undefined) {
         const entry = await this.getMeridianEntry(key)
         if (entry !== undefined) {
            return entry[property]
         }
      }
   }

   public async updateMeridianEntryProperty(
      property: keyof IMeridianEntry,
      key: string,
      payload: string | string[]
   ): Promise<void> {
      if (key !== undefined) {
         const entry = await this.getMeridianEntry(key)
         if (entry !== undefined) {
            entry[key] = payload
         }
      }
   }
}
