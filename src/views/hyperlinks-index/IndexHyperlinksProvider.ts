import { IndexHyperlinks } from "./IndexHyperlinks"
import * as vscode from "vscode"

export class IndexHyperlinksProvider
   implements vscode.TreeDataProvider<TreeItem>
{
   private activeFile: string | undefined
   private outlinks
   private workspaceFiles: string[] | undefined
   private _onDidChangeTreeData: vscode.EventEmitter<undefined | null | void> =
      new vscode.EventEmitter<undefined | null | void>()
   readonly onDidChangeTreeData: vscode.Event<undefined | null | void> =
      this._onDidChangeTreeData.event

   constructor(
      activeFile: string | undefined,
      workspaceFiles: string[] | undefined
   ) {
      this.setActiveFile(activeFile)
      this.outlinks = this.generateOutlinks()
      this.workspaceFiles = workspaceFiles
   }

   public setActiveFile(activeFile: string | undefined) {
      this.activeFile = activeFile
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
         return this.outlinks
      }
      return element.children
   }

   public refresh() {
      this.outlinks = this.generateOutlinks()
      this._onDidChangeTreeData.fire()
   }

   private async generateOutlinks(): Promise<TreeItem[]> {
      const indexer = new IndexHyperlinks(
         this.activeFile as string,
         this.workspaceFiles
      )
      const outlinks = await indexer.returnOutlinks()
      return this.transformOutlinksToTreeItem(outlinks)
   }

   private transformOutlinksToTreeItem(outlinks: string[]): TreeItem[] {
      let transformed: TreeItem[]
      transformed = outlinks.map(
         (outlink) =>
            new TreeItem(outlink, {
               command: "vscode.open",
               title: "",
               arguments: [outlink],
            })
      )
      return transformed
   }
}

class TreeItem extends vscode.TreeItem {
   children: TreeItem[] | undefined
   constructor(
      label: string,
      //   children?: TreeItem[],
      public command?: vscode.Command
   ) {
      super(label)
   }
}
