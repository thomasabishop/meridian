import * as path from "path"

export class FileSystemUtils {
   public parseFileTitle(filePath: string): string {
      return path.parse(filePath).name.split("_").join(" ")
   }

   public fileIsMd(file: string): boolean {
      return path.extname(file) === ".md"
   }

   public removeRootPath(
      file: string,
      workspaceRoot: string | undefined
   ): string | undefined {
      if (typeof workspaceRoot === "string") {
         return file.replace(`${workspaceRoot}/`, "")
      }
   }

   // TODO: see if this supercedes the method above
   public extractFileNameFromFullPath(fullPath: string) {
      return path.basename(fullPath, "md")
   }
   public stripAnchorFromLink(link: string): string {
      return link.includes("#") ? link.split("#")[0] : link
   }
}
