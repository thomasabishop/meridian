import { IndexMetadata } from "./classes/IndexMetadata"
import * as vscode from "vscode"
import { Tags } from "./views/tags/Tags"

export function activate(context: vscode.ExtensionContext) {
  console.log("Your extension is activated")
  vscode.window.showInformationMessage("Application started")
  vscode.window.createTreeView("tags", {
    treeDataProvider: new Tags(),
  })

  // Temporary logging
  let wipTagView = new Tags()
  console.log(wipTagView.metadataTemp())
}

// this method is called when your extension is deactivated
export function deactivate() {}
