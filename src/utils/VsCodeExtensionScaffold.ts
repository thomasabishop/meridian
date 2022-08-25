import { FileSystemUtils } from "./FileSystemUtils"
import * as vscode from "vscode"

export default class VsCodeExtensionScaffold {
   public workspaceRoot: string | undefined
   private extensionContext: vscode.ExtensionContext
   constructor(context: vscode.ExtensionContext) {
      this.workspaceRoot = this.returnWorkspaceRoot()
      this.extensionContext = context
   }

   public registerCommands(
      commands: { name: string; command: () => void }[]
   ): void {
      for (const command of commands) {
         let commandRef = vscode.commands.registerCommand(
            command.name,
            command.command
         )
         this.registerSubscription(commandRef)
      }
   }

   public registerSubscription(s: vscode.Disposable): void {
      this.extensionContext.subscriptions.push(s)
   }

   private returnWorkspaceRoot(): string | undefined {
      return vscode.workspace.workspaceFolders &&
         vscode.workspace.workspaceFolders.length > 0
         ? vscode.workspace.workspaceFolders[0].uri.fsPath
         : undefined
   }
}
