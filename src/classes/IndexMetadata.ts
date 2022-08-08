import * as fs from "fs"
import * as path from "path"
import * as vscode from "vscode"
import * as yamlFrontMatter from "yaml-front-matter"
import * as readDirRecurse from "recursive-readdir"

export class IndexMetadata {
  public tagIndex: ITagIndex[] = []
  private readonly projectRootDir: string | undefined
  constructor(projectRootDir: string | undefined) {
    this.projectRootDir = projectRootDir
  }

  public async init(): Promise<any> {
    const files = await this.getDirFiles()
    let parsed: IMetadatum[] = []

    if (files !== undefined) {
      if (!this.dirHasMd(files)) {
        return vscode.window.showErrorMessage(
          "Workspace root directory does not  contain Markdown files"
        )
      } else {
        for (const file of files) {
          let metadata = await this.parseFileFrontmatter(file)
          parsed.push(...metadata)
        }
        console.log(this.createIndex(parsed))
      }
    }
  }

  private createIndex(metadata: IMetadatum[]): ITagIndex {
    let index: ITagIndex = {}
    metadata.map((ele: any) => {
      !Object.keys(index).includes(ele.tag)
        ? (index[ele.tag] = [ele.file])
        : index[ele.tag].push(ele.file)
    })
    return index as ITagIndex
  }

  private dirHasMd(dirContents: string[]): boolean {
    const filteredMd = dirContents.filter(
      (file) => path.extname(file) === ".md"
    )
    return !filteredMd.length ? false : true
  }

  private async getDirFiles(): Promise<string[] | undefined> {
    try {
      const dirContents = await readDirRecurse(
        path.resolve(this.projectRootDir as string)
      )
      return dirContents
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log(err.message)
      }
    }
  }

  private async parseFileFrontmatter(markdownFile: string) {
    const fileContents = await fs.promises.readFile(markdownFile, "utf-8")
    const tagsForFile = yamlFrontMatter.loadFront(fileContents).tags
    return tagsForFile.map((tag: string) => ({ tag: tag, file: markdownFile }))
  }
}

interface ITagIndex {
  [key: string]: string[]
}

interface IMetadatum {
  tag: string
  file: string
}
