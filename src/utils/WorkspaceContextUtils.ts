import * as vscode from "vscode"
import { IMeridianIndex, IMeridianEntry } from "../main/Meridian"
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
}
