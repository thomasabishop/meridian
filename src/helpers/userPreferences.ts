import * as vscode from "vscode"
// For now store all user pref related stuff here, later work into a class

interface UserPreferences {
   ignoreDirectories: string[] | undefined
}

function getDirectoriesToIgnore() {
   const dirs = vscode.workspace
      .getConfiguration("meridian")
      .get("dirsToIgnore") as string[]
   if (dirs) {
      return [".git", ...dirs]
   }
}

export const userPreferences: UserPreferences = {
   ignoreDirectories: getDirectoriesToIgnore(),
}
