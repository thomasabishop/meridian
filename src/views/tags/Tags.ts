import * as vscode from "vscode"
import { IndexMetadata } from "../../classes/IndexMetadata"
export class Tags implements vscode.TreeDataProvider<TreeItem> {
  testData: TreeItem[]
  rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined

  constructor() {
    this.testData = [new TreeItem("A Tag", [new TreeItem("A file")])]
  }

  getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element
  }

  getChildren(
    element?: TreeItem | undefined
  ): vscode.ProviderResult<TreeItem[]> {
    if (element === undefined) {
      return this.testData
    }
    return element.children
  }

  metadataTemp(): any {
    let tagMd
    if (this.rootPath === undefined) {
      vscode.window.showErrorMessage("Workspace is empty")
      return
    } else {
      tagMd = new IndexMetadata(this.rootPath)
      return tagMd.init()
    }
  }
}

class TreeItem extends vscode.TreeItem {
  children: TreeItem[] | undefined

  constructor(label: string, children?: TreeItem[]) {
    super(
      label,
      children === undefined
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Expanded
    )
    this.children = children
  }
}
