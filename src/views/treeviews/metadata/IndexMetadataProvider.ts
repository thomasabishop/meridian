import IMetadataMap, { IndexMetadata, MetadataTypes } from "./IndexMetadata"
import * as vscode from "vscode"
import * as lodash from "lodash"
import { MeridianIndexCrud } from "../../../utils/MeridianIndexCrud"

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
   private meridianIndexCrud: MeridianIndexCrud

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
      this.meridianIndexCrud = new MeridianIndexCrud(workspaceContext)
   }

   /**
    * Take array of metadata tokens and their corresponding files, convert to VSCode TreeView
    */
   private transformMetadataToTreeItem(
      metadataIndex: IMetadataMap[]
   ): TreeItem[] {
      const populateTreeItemChildren = (fileRefs: IMetadataMap["files"]) =>
         fileRefs.reduce<TreeItem[]>((acc, fileRef) => {
            const { filePath, fileTitle } = fileRef
            if (fileTitle) {
               acc.push(
                  new TreeItem(fileTitle, undefined, {
                     command: "vscode.open",
                     title: "",
                     arguments: [vscode.Uri.file(filePath)],
                  })
               )
            }
            return acc
         }, [])

      const transformed = metadataIndex.map(
         ({ token, files }) =>
            new TreeItem(token, populateTreeItemChildren(files))
      )

      // Sort alphabetically
      return lodash.orderBy(transformed, ["label"], ["asc"])
   }

   public getTreeItem(
      element: TreeItem
   ): vscode.TreeItem | Thenable<vscode.TreeItem> {
      return element
   }

   public getChildren(element?: TreeItem): vscode.ProviderResult<TreeItem[]> {
      return element === undefined ? this.metadataIndex : element.children
   }

   // Repopulate metadata index
   public refresh(): void {
      this.metadataIndex = this.generateMetadataIndex()
      this._onDidChangeTreeData.fire()
   }

   private async generateMetadataIndex(): Promise<TreeItem[] | undefined> {
      const indexer = new IndexMetadata(this.context)
      const data = await indexer.collateAllMetadataOfType(this.metadataType)
      return data && typeof data !== "string"
         ? this.transformMetadataToTreeItem(data)
         : undefined
   }

   // Return segment of metadata scoped to the currently active editor:
   public async filterMetadataIndexForCurrentFile(
      metadataType: MetadataTypes,
      activeFile?: string
   ): Promise<void> {
      if (!activeFile || !metadataType) return

      const metadataForFile =
         await this.meridianIndexCrud.getMeridianEntryProperty(
            metadataType,
            activeFile
         )

      if (Array.isArray(metadataForFile)) {
         const index = await this.metadataIndex
         const filtered = index?.filter((treeItem) =>
            typeof treeItem.label === "string"
               ? metadataForFile.includes(treeItem.label)
               : false
         )

         if (filtered?.length) {
            this.metadataIndex = filtered
            this._onDidChangeTreeData.fire()
         }
      }
   }

   // Toggle a value in context to mark whether the given Metadata view is scoped to the current file:
   public updateTreeviewScopedStatus(isScoped: boolean, contextToggle: string) {
      vscode.commands.executeCommand("setContext", contextToggle, isScoped)
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
