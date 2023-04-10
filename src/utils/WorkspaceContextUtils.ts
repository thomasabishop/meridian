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

   public async writeToWorkspaceContext<T>(
      key: string,
      value: IMeridianIndex
   ): Promise<void> {
      await this.context.workspaceState.update(key, value)
   }

   public async readFromWorkspaceContext<T>(
      key: string
   ): Promise<IMeridianIndex | undefined> {
      return this.context.workspaceState.get<IMeridianIndex>(key)
   }

   public async clearWorkspaceContext(key: string): Promise<void> {
      await this.context.workspaceState.update(key, undefined)
   }
}
