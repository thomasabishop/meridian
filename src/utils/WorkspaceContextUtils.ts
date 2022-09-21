import * as vscode from "vscode"
import { IWorkspaceMap } from "./WorkspaceUtils"
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
   ): Promise<Map<string, IWorkspaceMap> | undefined> {
      return await this.context?.workspaceState?.get(key)
   }

   public async clearWorkspaceContextItem(key: string): Promise<void> {
      await this.context?.workspaceState?.update(key, undefined)
   }
}
