import { LinkTypes } from "./../hyperlinks-index/IndexHyperlinks"
import { WorkspaceContextUtils } from "./../../../utils/WorkspaceContextUtils"
import IMetadataMap, { IndexMetadata, MetadataTypes } from "./IndexMetadata"
import * as vscode from "vscode"
import * as lodash from "lodash"

/**
 * Extends the default VS Code TreeDataProvider.
 * Used to create TreeViews of markdown metadata.
 */

export class IndexMetadataProvider
   implements vscode.TreeDataProvider<TreeItem>
{
   private context: vscode.ExtensionContext
   private readonly metadataType: MetadataTypes
   private metadataIndex: Promise<TreeItem[] | undefined> | TreeItem[]

   private _onDidChangeTreeData: vscode.EventEmitter<undefined | null | void> =
      new vscode.EventEmitter<undefined | null | void>()
   readonly onDidChangeTreeData: vscode.Event<undefined | null | void> =
      this._onDidChangeTreeData.event

   constructor(
      workspaceContext: vscode.ExtensionContext,
      metadataType: MetadataTypes
   ) {
      this.context = workspaceContext
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
      const indexer = new IndexMetadata(this.context)
      const data = await indexer.collateAllMetadataOfType(this.metadataType)
      if (data !== undefined && typeof data !== "string") {
         return this.transformMetadataToTreeItem(data)
      }
   }

   // Return segment of metadata scoped to the currently active editor:
   public async filterMetadataIndexForCurrentFile(
      metadataType: MetadataTypes, // categories or tags
      activeFile: string | undefined
   ): Promise<void> {
      const workspaceContextUtils = new WorkspaceContextUtils(this.context)
      if (activeFile !== undefined && metadataType !== undefined) {
         const metadataForFile =
            await workspaceContextUtils.getMeridianEntryProperty(
               metadataType,
               activeFile
            )

         const index = await this.metadataIndex
         const filtered = index?.filter((treeItem: TreeItem) =>
            metadataForFile?.includes(treeItem.label as string)
         )

         if (filtered?.length) {
            this.metadataIndex = filtered
            this._onDidChangeTreeData.fire()
         }
         return
      }
   }

   // Toggle a value in context to mark whether the given Metadata view is scoped to the current file:
   public updateTreeviewScopedStatus(isScoped: boolean, contextToggle: string) {
      vscode.commands.executeCommand("setContext", contextToggle, isScoped)
   }

   private transformMetadataToTreeItem(
      metadataIndex: IMetadataMap[]
   ): TreeItem[] {
      let transformed: TreeItem[]

      const populateTreeItemChildren = (fileRefs: IMetadataMap["files"]) =>
         fileRefs
            .filter((fileRef) => fileRef.fileTitle !== undefined)
            .map(
               (fileRef: { filePath: string; fileTitle?: string }) =>
                  new TreeItem(fileRef!.fileTitle as string, undefined, {
                     command: "vscode.open",
                     title: "",
                     arguments: [vscode.Uri.file(fileRef.filePath)],
                  })
            )

      transformed = metadataIndex.map(
         (datum: IMetadataMap) =>
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
