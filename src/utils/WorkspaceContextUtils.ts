import * as vscode from "vscode"

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
      value: T
   ): Promise<void> {
      await this.context.workspaceState.update(key, value)
   }

   public async readFromWorkspaceContext<T>(
      key: string
   ): Promise<T | undefined> {
      return await this.context.workspaceState.get<T>(key)
   }

   public async clearWorkspaceContext(key: string): Promise<void> {
      await this.context.workspaceState.update(key, undefined)
   }
}
