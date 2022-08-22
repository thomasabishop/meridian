import { IndexMetadata } from "./IndexMetadata"
import * as vscode from "vscode"
import * as lodash from "lodash"
import { IMetadataIndex } from "./IndexMetadata"

export class IndexMetadataProvider
   implements vscode.TreeDataProvider<TreeItem>
{
   private metadataIndex: Promise<TreeItem[] | undefined>
   private readonly projectRoot
   private readonly metadataType: string
   private _onDidChangeTreeData: vscode.EventEmitter<undefined | null | void> =
      new vscode.EventEmitter<undefined | null | void>()
   readonly onDidChangeTreeData: vscode.Event<undefined | null | void> =
      this._onDidChangeTreeData.event

   constructor(projectRoot: string, metadataType: string) {
      this.projectRoot = projectRoot
      this.metadataType = metadataType
      this.metadataIndex = this.generateMetadataIndex()
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
         return this.metadataIndex
      }
      return element.children
   }

   // Repopulate index for metadata type
   public refreshIndex(): void {
      this.metadataIndex = this.generateMetadataIndex()
      this._onDidChangeTreeData.fire()
   }

   private async generateMetadataIndex(): Promise<TreeItem[] | undefined> {
      const indexer = new IndexMetadata(this.projectRoot, this.metadataType)
      const data = await indexer.main()
      if (data !== undefined && typeof data !== "string") {
         return this.transformMetadataToTreeItem(data)
      }
   }

   private transformMetadataToTreeItem(
      metadataIndex: IMetadataIndex[]
   ): TreeItem[] {
      let transformed: TreeItem[]

      const populateTreeItemChildren = (fileRefs: IMetadataIndex["files"]) =>
         fileRefs.map(
            (fileRef: any) =>
               new TreeItem(fileRef.fileTitle, undefined, {
                  command: "vscode.open",
                  title: "",
                  arguments: [vscode.Uri.file(fileRef.filePath)],
               })
         )

      transformed = metadataIndex.map(
         (datum: IMetadataIndex) =>
            new TreeItem(datum.token, [
               ...populateTreeItemChildren(datum.files),
            ])
      )
      // Sort alphabetically
      transformed = lodash.orderBy(transformed, ["label"], ["asc"])
      return [...transformed]
   }
}

// Create recursive TreeItem object which accepts label, child TreeItems and clickable link to listed resource

class TreeItem extends vscode.TreeItem {
   children: TreeItem[] | undefined
   constructor(
      label: string,
      children?: TreeItem[],
      public command?: vscode.Command
   ) {
      super(
         label,
         children === undefined
            ? vscode.TreeItemCollapsibleState.None
            : vscode.TreeItemCollapsibleState.Collapsed
      )
      this.children = children
   }
}
