import * as vscode from "vscode"
import IWorkspaceMap from "../types/IWorkspaceMap"
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
   ): Promise<Map<string, IWorkspaceMap> | undefined> {
      return await this.context?.workspaceState?.get(key)
   }

   public async clearWorkspaceContext(key: string): Promise<void> {
      await this.context?.workspaceState?.update(key, undefined)
   }

   /**
    * Methods to modify the Meridian map object stored in VSCode Workspace state
    */

   public async retrieveWorkspaceMapEntry(
      mapKey: IWorkspaceMap["fullPath"]
   ): Promise<IWorkspaceMap | undefined> {
      if (mapKey !== undefined) {
         const workspaceMap = await this.readFromWorkspaceContext("MERIDIAN")
         const mapEntry = workspaceMap?.get(mapKey)
         return mapEntry
      }
   }

   public async updateWorkspaceMapEntry(
      mapKey: IWorkspaceMap["fullPath"],
      payload: IWorkspaceMap
   ) {
      const workspaceMap = await this.readFromWorkspaceContext("MERIDIAN")
      return workspaceMap?.set(mapKey, payload)
   }

   public async deleteWorkspaceMapEntry(mapKey: IWorkspaceMap["fullPath"]) {
      const workspaceMap = await this.readFromWorkspaceContext("MERIDIAN")
      return workspaceMap?.delete(mapKey)
   }

   public async retrieveWorkspaceMapEntryProp(
      propType: keyof IWorkspaceMap,
      mapKey: IWorkspaceMap["fullPath"]
   ): Promise<IWorkspaceMap[keyof IWorkspaceMap]> {
      if (mapKey !== undefined) {
         const mapEntry = await this.retrieveWorkspaceMapEntry(mapKey)
         if (mapEntry !== undefined) {
            return mapEntry[propType]
         }
      }
   }

   public async updateWorkspaceMapEntryProp(
      propType: keyof IWorkspaceMap,
      mapKey: IWorkspaceMap["fullPath"],
      payload: IWorkspaceMap[keyof IWorkspaceMap]
   ): Promise<void> {
      if (mapKey !== undefined) {
         const mapEntry = await this.retrieveWorkspaceMapEntry(mapKey)
         if (mapEntry !== undefined) {
            mapEntry[propType] = payload
         }
      }
   }
}
