import * as path from "path"

export class FileSystemUtils {
   public parseFileTitle(filePath: string): string {
      return path.parse(filePath).name.split("_").join(" ")
   }

   public fileIsMd(file: string): boolean {
      return path.extname(file) === ".md"
   }

   public extractFileNameFromFullPath(fullPath: string): string {
      return path.basename(fullPath, ".md")
   }
   public stripAnchorFromLink(link: string): string {
      return link.includes("#") ? link.split("#")[0] : link
   }
}
