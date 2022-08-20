import * as fs from "fs"
import * as path from "path"
import * as vscode from "vscode"
import * as yamlFrontMatter from "yaml-front-matter"
import * as readDirRecurse from "recursive-readdir"

export class IndexMetadata {
  private readonly projectRootDir: string | undefined
  private dirsToIgnore = [".git"]

  constructor(projectRootDir: string | undefined) {
    this.projectRootDir = projectRootDir
    this.setDirsToIgnore()
  }

  public async main(): Promise<IMetadataIndex[] | string | undefined> {
    const files = await this.getDirFiles()
    let parsed: IMetadatum[] = []
    if (files === undefined) {
      return
    }
    for (const file of files) {
      let metadata = await this.parseFileFrontmatter(file)
      metadata !== undefined && parsed.push(...metadata)
    }

    return this.createMetadataIndex(parsed)
  }

  // TODO: Make this more algorithmically efficient later
  private createMetadataIndex(metadata: IMetadatum[]): IMetadataIndex[] {
    let index: IMetadataIndex[] = []
    metadata.map((metadatum: IMetadatum): void => {
      // If token exists in index, add file to its preexisting array
      // Else create new index entry for token
      !index.some((x) => x.token === metadatum.token)
        ? index.push({
            token: metadatum.token,
            files: [
              {
                filePath: metadatum.file,
                fileTitle: metadatum.fileTitle,
              },
            ],
          })
        : index
            .filter((y) => y.token === metadatum.token)[0]
            .files.push({
              filePath: metadatum.file,
              fileTitle: metadatum.fileTitle,
            })
    })
    return index
  }

  private async getDirFiles(): Promise<string[] | undefined> {
    try {
      const dirContents = await readDirRecurse(
        path.resolve(this.projectRootDir as string),
        [...this.dirsToIgnore]
      )
      return dirContents
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message)
      }
    }
  }

  private setDirsToIgnore(): void {
    let ignoreDirs = vscode.workspace
      .getConfiguration()
      .get("meridian.ignoreDirs") as string[]
    if (ignoreDirs?.length) {
      this.dirsToIgnore.push(...ignoreDirs)
    } else {
      return
    }
  }

  private async parseFileFrontmatter(
    markdownFile: string
  ): Promise<IMetadatum[] | undefined> {
    if (!this.fileIsMd(markdownFile)) {
      // TODO: Raise VSCode toast and write unindexable file to Extension log
      return
    }

    const fileContents = await fs.promises.readFile(markdownFile, "utf-8")
    const tagsForFile = yamlFrontMatter.loadFront(fileContents).tags
    if (tagsForFile === undefined) {
      // TODO: Raise VSCode toast and write unindexable file to Extension log
      return
    } else {
      return tagsForFile.map((tag: string) => ({
        token: tag,
        file: markdownFile,
        fileTitle: this.parseFileTitle(markdownFile),
      }))
    }
  }

  private parseFileTitle(filePath: string): string {
    return path.parse(filePath).name.split("_").join(" ")
  }

  public fileIsMd(file: string): boolean {
    return path.extname(file) === ".md"
  }
}

export interface IMetadataIndex {
  token: string
  files: {
    filePath: string
    fileTitle?: string | undefined
  }[]

  // turn this into an array of object with shape `file: ..., fileTitle...`
}

interface IMetadatum {
  token: string
  file: string
  fileTitle?: string
}
