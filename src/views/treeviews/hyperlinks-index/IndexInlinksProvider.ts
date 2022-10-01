import { AbstractIndexHyperlinksProvider } from "./AbstractIndexHyperlinksProvider"
import { TreeItem } from "./AbstractIndexHyperlinksProvider"
import * as vscode from "vscode"
import { IndexHyperlinks } from "./IndexHyperlinks"

/**
 * Extend HyperLink provider abstract to create Inlinks view.
 */

export class IndexInlinksProvider extends AbstractIndexHyperlinksProvider {
   public workspaceFiles: string[]
   public context: vscode.ExtensionContext
   constructor(
      activeFile: string | undefined,
      workspaceRoot: string | undefined,
      workspaceFiles: string[],
      context: vscode.ExtensionContext
   ) {
      super(activeFile, workspaceRoot)
      this.workspaceFiles = workspaceFiles
      this.context = context
   }

   public async generateLinks(): Promise<TreeItem[] | undefined> {
      const indexer = new IndexHyperlinks(this.context, this.workspaceFiles)
      if (typeof this.activeFile === "string") {
         const inlinks = await indexer.indexInlinks(this.activeFile)
         if (inlinks !== undefined) {
            return this.transformLinksToTreeItem(inlinks)
         }
      }
      return
   }
}
