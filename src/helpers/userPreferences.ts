import * as vscode from "vscode"
import { printChannelOutput } from "./logger"
// For now store all user pref related stuff here, later work into a class

interface UserPreferences {
   ignoreDirectories: string[] | undefined
}

function getDirectoriesToIgnore() {
   const dirs = vscode.workspace.getConfiguration("meridian").get("dirsToIgnore") as string[]
   if (dirs) {
      printChannelOutput(`Meridian is ignoring the directories: ${dirs}`)
      return [".git", ...dirs]
   }
}

export const userPreferences: UserPreferences = {
   ignoreDirectories: getDirectoriesToIgnore(),
}
