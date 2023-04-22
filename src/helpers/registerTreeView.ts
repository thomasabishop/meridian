import { IndexMetadataProvider } from "../views/treeviews/metadata/IndexMetadataProvider"
import { IndexHyperlinksProvider } from "../views/treeviews/hyperlinks/IndexHyperlinksProvider"
import { LinkTypes } from "../views/treeviews/hyperlinks/IndexHyperlinks"
import { MetadataTypes } from "../views/treeviews/metadata/IndexMetadata"
import * as vscode from "vscode"

/**
 * Instantiates VSCode TreeView and populates initial display values.
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
      view.refresh()
   }
   vscode.window.registerTreeDataProvider(type, view)
   return view
}
