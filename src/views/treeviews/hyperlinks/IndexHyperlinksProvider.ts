import { FileSystemUtils } from "../../../utils/FileSystemUtils"
import * as vscode from "vscode"
import IndexHyperlinks from "./IndexHyperlinks"
import { LinkTypes } from "./IndexHyperlinks"
import { MeridianIndexCrud } from "../../../utils/MeridianIndexCrud"

/**
 * Create TreeProvider for hyperlink views.
 */

export class IndexHyperlinksProvider
   implements vscode.TreeDataProvider<TreeItem>
{
   private workspaceFiles: string[] | undefined
   private meridianIndexCrud: MeridianIndexCrud
   private fileSystemUtils: FileSystemUtils
   private hyperlinks: Promise<TreeItem[] | undefined>
   private _onDidChangeTreeData: vscode.EventEmitter<undefined | null | void> =
      new vscode.EventEmitter<undefined | null | void>()
   public activeFile: string | undefined
   public context: vscode.ExtensionContext
   public readonly onDidChangeTreeData: vscode.Event<undefined | null | void> =
      this._onDidChangeTreeData.event

   constructor(
      activeFile: string | undefined,
      workspaceFiles: string[] | undefined,
      context: vscode.ExtensionContext,
      meridianIndexCrud: MeridianIndexCrud,
      fileSystemUtils: FileSystemUtils
   ) {
      this.activeFile = activeFile
      this.fileSystemUtils = fileSystemUtils
      this.workspaceFiles = workspaceFiles
      this.context = context
      this.meridianIndexCrud = meridianIndexCrud
   }

   private renderPrettyLink(link: string): string {
      const anchorText = this.fileSystemUtils.parseFileTitle(link)
      if (link.includes("#")) {
         return `${anchorText} > ${link.split("#")[1]}`
      } else {
         return anchorText
      }
   }

   private getIndexedHyperlinks(workspaceFiles: string[]): IndexHyperlinks {
      return new IndexHyperlinks(
         workspaceFiles,
         this.meridianIndexCrud,
         this.fileSystemUtils
      )
   }

   public async collateLinksForTreeView(
      linkType: LinkTypes
   ): Promise<TreeItem[] | undefined> {
      if (this.workspaceFiles && this.activeFile) {
         const links = await this.getIndexedHyperlinks(
            this.workspaceFiles
         ).getLinks(this.activeFile, linkType)
         if (links) {
            return this.transformLinksToTreeItem(links)
         }
      }
   }

   public refresh(activeFile: string | undefined, linkType: LinkTypes) {
      this._onDidChangeTreeData.fire()
      this.activeFile = activeFile
      this.hyperlinks = this.collateLinksForTreeView(linkType)
   }

   public transformLinksToTreeItem(links: string[]): TreeItem[] {
      return links
         .filter((link) => link)
         .map((link) => {
            const treeItem = new TreeItem(this.renderPrettyLink(link), {
               command: "vscode.open",
               title: "",
               arguments: [link],
            })
            treeItem.tooltip =
               this.fileSystemUtils.extractFileNameFromFullPath(link)
            return treeItem
         })
   }

   public getTreeItem(
      element: TreeItem
   ): vscode.TreeItem | Thenable<vscode.TreeItem> {
      return element
   }

   public getChildren(
      element?: TreeItem | undefined
   ): vscode.ProviderResult<TreeItem[]> {
      return element === undefined ? this.hyperlinks : element.children
   }
}

export class TreeItem extends vscode.TreeItem {
   children: TreeItem[] | undefined
   constructor(label: string, public command?: vscode.Command) {
      super(label)
   }
}
