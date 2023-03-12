import { IMeridianIndex } from "./WorkspaceUtils"
import * as vscode from "vscode"
import { IMeridianEntry } from "./WorkspaceUtils"
export class WorkspaceContextUtils {
   private context: vscode.ExtensionContext
   constructor(context: vscode.ExtensionContext) {
      this.context = context
   }

   /**
    * Methods to modify the VSCode Workspace state
    */

   public async writeToWorkspaceContext(
      key: string,
      value: any
   ): Promise<void> {
      await this.context?.workspaceState?.update(key, value)
   }

   public async readFromWorkspaceContext(
      key: string
   ): Promise<IMeridianIndex | undefined> {
      return await this.context?.workspaceState?.get(key)
   }

   public async clearWorkspaceContext(key: string): Promise<void> {
      await this.context?.workspaceState?.update(key, undefined)
   }

   /**
    * Methods to modify the Meridian map object stored in VSCode Workspace state
    */

   public async getMeridianEntry(
      key: string
   ): Promise<IMeridianEntry | undefined> {
      if (key !== undefined) {
         const workspaceIndex = await this.readFromWorkspaceContext("MERIDIAN")
         if (workspaceIndex !== undefined && key in workspaceIndex) {
            return workspaceIndex[key]
         }
      }
   }

   public async updateMeridianEntry(
      key: string,
      payload: IMeridianEntry
   ): Promise<void> {
      const workspaceIndex = await this.readFromWorkspaceContext("MERIDIAN")
      if (workspaceIndex !== undefined && key in workspaceIndex) {
         workspaceIndex[key] = payload
      }
   }

   public async deleteMeridianEntry(key: string): Promise<void> {
      const workspaceIndex = await this.readFromWorkspaceContext("MERIDIAN")
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
