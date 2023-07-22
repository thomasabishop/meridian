import * as vscode from "vscode"
import { printChannelOutput } from "../helpers/logger"

export class UserPreferences {
   public readonly ignoreDirs: string[] | undefined = ["node_modules", ".git"]

   constructor() {
      this.getIgnoreDirs()
   }

   private getIgnoreDirs() {
      const userIgnores = vscode.workspace
         .getConfiguration("meridian")
         .get("dirsToIgnore") as string[]

      if (userIgnores) {
         this.ignoreDirs?.push(...userIgnores)
      }
      printChannelOutput(`Meridian is ignoring the directories ${this.ignoreDirs}`)
   }
}
