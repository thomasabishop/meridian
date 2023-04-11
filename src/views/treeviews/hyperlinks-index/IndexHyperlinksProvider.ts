// import { FileSystemUtils } from "./../../../utils/FileSystemUtils"
import { WorkspaceContextUtils } from "./../../../utils/WorkspaceContextUtils"
import { FileSystemUtils } from "../../../utils/FileSystemUtils"
import * as vscode from "vscode"
import IndexHyperlinks from "./IndexHyperlinks"
import { LinkTypes } from "./IndexHyperlinks"
import { MeridianIndexCrud } from "../../../main/MeridianIndexCrud"
/**
 * Create TreeProvider for hyperlink views.
 */

export class IndexHyperlinksProvider
   implements vscode.TreeDataProvider<TreeItem>
{
   public _activeFile: string | undefined
   public context: vscode.ExtensionContext
   public workspaceFiles: string[] | undefined
   public meridianIndexCrud: MeridianIndexCrud
   public fileSystemUtils: FileSystemUtils
   private hyperlinks: Promise<TreeItem[] | undefined>
   private _onDidChangeTreeData: vscode.EventEmitter<undefined | null | void> =
      new vscode.EventEmitter<undefined | null | void>()
   readonly onDidChangeTreeData: vscode.Event<undefined | null | void> =
      this._onDidChangeTreeData.event

   constructor(
      activeFile: string | undefined,
      workspaceFiles: string[] | undefined,
      context: vscode.ExtensionContext
   ) {
      this._activeFile = activeFile
      this.fileSystemUtils = new FileSystemUtils()
      this.workspaceFiles = workspaceFiles
      this.context = context
      this.meridianIndexCrud = new MeridianIndexCrud(context)
   }

   public get activeFile() {
      return this._activeFile
   }

   public set activeFile(activeFile: string | undefined) {
      this._activeFile = activeFile
   }

   public async generateLinks(
      linkType: LinkTypes
   ): Promise<TreeItem[] | undefined> {
      if (this.workspaceFiles !== undefined) {
         const indexer = new IndexHyperlinks(
            this.workspaceFiles,
            this.meridianIndexCrud,
            this.fileSystemUtils
         )
         if (typeof this.activeFile === "string") {
            const links = await indexer.getLinks(this.activeFile, linkType)
            if (links !== undefined) {
               return this.transformLinksToTreeItem(links)
            }
         }
      }
   }

   public refresh(activeFile: string | undefined, linkType: LinkTypes) {
      this._onDidChangeTreeData.fire()
      this._activeFile = activeFile
      this.hyperlinks = this.generateLinks(linkType)
   }

   public transformLinksToTreeItem(links: string[]): TreeItem[] {
      links = links.filter((link) => link !== undefined)
      let transformed: TreeItem[] = []
      for (const link of links) {
         const treeItem = new TreeItem(this.renderPrettyLink(link), {
            command: "vscode.open",
            title: "",
            arguments: [link],
         })
         treeItem.tooltip =
            this.fileSystemUtils.extractFileNameFromFullPath(link)
         transformed.push(treeItem)
      }
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

   private renderPrettyLink(link: string) {
      const anchorText = this.fileSystemUtils.parseFileTitle(link)
      if (link.includes("#")) {
         return `${anchorText} > ${link.split("#")[1]}`
      } else {
         return anchorText
      }
   }
}

export class TreeItem extends vscode.TreeItem {
   children: TreeItem[] | undefined
   constructor(label: string, public command?: vscode.Command) {
      super(label)
   }
}
