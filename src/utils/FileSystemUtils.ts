import * as path from "path"

export class FileSystemUtils {
   private readonly workspaceRoot: string | undefined

   constructor(workspaceRoot: string | undefined) {
      this.workspaceRoot = workspaceRoot
   }

   public parseFileTitle(filePath: string): string {
      return path.parse(filePath).name.split("_").join(" ")
   }

   public fileIsMd(file: string): boolean {
      return path.extname(file) === ".md"
   }

   public removeRootPath(file: string): string | undefined {
      if (typeof this.workspaceRoot === "string") {
         return file.replace(`${this.workspaceRoot}/`, "")
      }
   }
}
