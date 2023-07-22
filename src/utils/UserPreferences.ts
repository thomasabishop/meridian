import * as vscode from "vscode"
import { printChannelOutput } from "../helpers/logger"

export class UserPreferences {
   private readonly ignoreFiles: string[] = [
      "!*.md",
      "README.md",
      "readme.md",
      "changelog.md",
      "CHANGELOG.md",
   ]
   public readonly ignoreDirs: string[] | undefined = [
      "!*.md",
      "node_modules",
      ".git",
      ...this.ignoreFiles,
   ]
   constructor() {
      this.getIgnoreDirs()
   }

   private getIgnoreDirs() {
      const userIgnores = vscode.workspace
         .getConfiguration("meridian")
         .get("dirsToIgnore") as string[]

      if (userIgnores) {
         this.ignoreDirs?.push(...userIgnores)
         printChannelOutput(`Meridian is ignoring the directories ${userIgnores}`)
      }
   }
}
