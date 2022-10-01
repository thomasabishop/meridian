import { FileSystemUtils } from "../../../utils/FileSystemUtils"
import * as vscode from "vscode"

/**
 * Create TreeProvider for hyperlink views.
 */

export abstract class AbstractIndexHyperlinksProvider
   implements vscode.TreeDataProvider<TreeItem>
{
   public _activeFile: string | undefined
   private hyperlinks: Promise<TreeItem[] | undefined>
   private fileSystemUtils: FileSystemUtils

   private _onDidChangeTreeData: vscode.EventEmitter<undefined | null | void> =
      new vscode.EventEmitter<undefined | null | void>()
   readonly onDidChangeTreeData: vscode.Event<undefined | null | void> =
      this._onDidChangeTreeData.event

   constructor(
      activeFile: string | undefined,
      workspaceRoot: string | undefined
   ) {
      this._activeFile = activeFile
      this.fileSystemUtils = new FileSystemUtils(workspaceRoot)
   }

   public get activeFile() {
      return this._activeFile
   }

   public set activeFile(activeFile: string | undefined) {
      this._activeFile = activeFile
   }

   abstract generateLinks(): Promise<TreeItem[] | undefined>

   public refresh(activeFile: string | undefined) {
      this._onDidChangeTreeData.fire()
      this._activeFile = activeFile
      this.hyperlinks = this.generateLinks()
   }

   public transformLinksToTreeItem(links: string[]): TreeItem[] {
      let transformed: TreeItem[]
      transformed = links.map(
         (link) =>
            new TreeItem(this.fileSystemUtils.removeRootPath(link) as string, {
               command: "vscode.open",
               title: "",
               arguments: [link],
            })
      )
      return transformed
   }

   public getTreeItem(
      element: TreeItem
   ): vscode.TreeItem | Thenable<vscode.TreeItem> {
      return element
   }

   public getChildren(
      element?: TreeItem | undefined
   ): vscode.ProviderResult<TreeItem[]> {
      if (element === undefined) {
         return this.hyperlinks
      }
      return element.children
   }
}

export class TreeItem extends vscode.TreeItem {
   children: TreeItem[] | undefined
   constructor(label: string, public command?: vscode.Command) {
      super(label)
   }
}
