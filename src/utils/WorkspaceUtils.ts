import * as path from "path"
import * as vscode from "vscode"
import * as readDirRecurse from "recursive-readdir"

export class WorkspaceUtils {
   public workspaceRoot: string | undefined
   public dirsToIgnore = [".git"]
   private context: vscode.ExtensionContext

   constructor(context: vscode.ExtensionContext) {
      this.context = context
      this.workspaceRoot = this.setWorkspaceRoot()
      this.setDirsToIgnore()
   }

   //   Create index of all Markdown files in workspace and store in VsCode Context

   public async indexWorkspaceFiles(): Promise<void> {
      try {
         const dirContents = await readDirRecurse(
            path.resolve(this.workspaceRoot as string),
            [...this.dirsToIgnore]
         )
         this.writeToWorkspaceContext("MERIDIAN_FILES", dirContents)
      } catch (err: unknown) {
         if (err instanceof Error) {
            console.error(err.message)
         }
      }
   }

   //   Create index of all Markdown files in workspace and store in VsCode Context

   public async writeToWorkspaceContext(
      key: string,
      value: any
   ): Promise<void> {
      await this.context.workspaceState.update(key, value)
   }

   public async readFromWorkspaceContext(
      key: string
   ): Promise<string[] | undefined> {
      return await this.context.workspaceState.get(key)
   }

   public async clearWorkspaceContextItem(key: string): Promise<void> {
      await this.context.workspaceState.update(key, undefined)
   }

   private setWorkspaceRoot(): string | undefined {
      return vscode.workspace.workspaceFolders &&
         vscode.workspace.workspaceFolders.length > 0
         ? vscode.workspace.workspaceFolders[0].uri.fsPath
         : undefined
   }

   private setDirsToIgnore(): void {
      const ignoreDirs = vscode.workspace
         .getConfiguration()
         .get("meridian.ignoreDirs") as string[]
      if (!ignoreDirs?.length) {
         return
      }

      this.dirsToIgnore.push(...ignoreDirs)
   }
}
