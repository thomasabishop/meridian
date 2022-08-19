import * as vscode from "vscode"
import * as _ from "lodash"
import { IMetadataIndex } from "../IndexMetadata"
export class MetadataListing implements vscode.TreeDataProvider<TreeItem> {
  private readonly metadataIndex: TreeItem[]

  constructor(metadataIndex: IMetadataIndex[]) {
    this.metadataIndex = this.transformMetadataToTreeItem(metadataIndex)
  }

  getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element
  }

  getChildren(
    element?: TreeItem | undefined
  ): vscode.ProviderResult<TreeItem[]> {
    if (element === undefined) {
      return this.metadataIndex
    }
    return element.children
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
        new TreeItem(datum.token, [...populateTreeItemChildren(datum.files)])
    )

    // Sort alphabetically
    transformed = _.orderBy(transformed, ["label"], ["asc"])
    return [...transformed]
  }
}

class TreeItem extends vscode.TreeItem {
  children: TreeItem[] | undefined
  constructor(
    label: string,
    children?: TreeItem[],
    public readonly command?: vscode.Command
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

// https://stackoverflow.com/questions/67975879/vs-code-extension-treeitem-command-property-how-to-issue-vscode-open
