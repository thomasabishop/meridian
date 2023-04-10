import { IndexMetadataProvider } from "../views/treeviews/metadata-index/IndexMetadataProvider"
import { IndexHyperlinksProvider } from "../views/treeviews/hyperlinks-index/IndexHyperlinksProvider"
import { LinkTypes } from "../views/treeviews/hyperlinks-index/IndexHyperlinks"
import { MetadataTypes } from "../views/treeviews/metadata-index/IndexMetadata"
import * as vscode from "vscode"

/**
 * Instantiates TreeView and registers it with VSCode, then populates initial display values.
 * From class instantiation inherits methods that are subsequently used to alter and update displayed * TreeView value in response to user events.
 */

export default function <
   T extends IndexHyperlinksProvider | IndexMetadataProvider,
   U extends LinkTypes | MetadataTypes
>(
   ProviderClass: new (...args: any[]) => T,
   type: U,
   ...args: ConstructorParameters<typeof ProviderClass>
): T {
   const view = new ProviderClass(...args, type)
   if (view instanceof IndexHyperlinksProvider) {
      view.refresh(
         vscode.window.activeTextEditor?.document.fileName,
         type as LinkTypes
      )
   } else if (view instanceof IndexMetadataProvider) {
      view.refreshIndex()
   }
   vscode.window.registerTreeDataProvider(type, view)
   return view
}