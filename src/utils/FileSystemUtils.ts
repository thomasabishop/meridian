import * as fs from "fs"
import * as path from "path"

export class FileSystemUtils {
   public fileIsMd(file: string): boolean {
      return path.extname(file) === ".md"
   }
}
