// import { userPreferences } from "./../helpers/userPreferences"
import * as path from "path"
import * as recursiveReadDir from "recursive-readdir"
import * as vscode from "vscode"
//import { userPreferences } from "../helpers/userPreferences"
import { UserPreferences } from "./UserPreferences"
export class FileSystemUtils {
   private userPreferences: UserPreferences

   constructor(userPreferences: UserPreferences) {
      this.userPreferences = userPreferences
   }

   private getWorkspaceRoot(): string | undefined {
      return vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
         ? vscode.workspace.workspaceFolders[0].uri.fsPath
         : undefined
   }

   public parseFileTitle(filePath: string): string {
      return path.parse(filePath).name.split("_").join(" ")
   }

   public fileIsMd(file: string): boolean {
      return path.extname(file) === ".md"
   }

   public extractFileNameFromFullPath(fullPath: string): string {
      return path.basename(fullPath, ".md")
   }

   public prettifyFileName(fileName: string): string {
      return this.parseFileTitle(this.extractFileNameFromFullPath(fileName))
   }

   public async collateWorkspaceFiles(): Promise<string[] | undefined> {
      const workspaceRoot = this.getWorkspaceRoot()

      if (workspaceRoot) {
         return await recursiveReadDir(
            path.resolve(workspaceRoot),
            this.userPreferences.ignoreDirs
            //      userPreferences.ignoreDirectories
         )
      }
   }
}
