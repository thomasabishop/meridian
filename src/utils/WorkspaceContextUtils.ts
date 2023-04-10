import * as vscode from "vscode"
import { IMeridianIndex } from "../main/Meridian"

/**
 * Modify the VSCode Workspace state
 */

export class WorkspaceContextUtils {
   private context: vscode.ExtensionContext
   constructor(context: vscode.ExtensionContext) {
      this.context = context
   }

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
