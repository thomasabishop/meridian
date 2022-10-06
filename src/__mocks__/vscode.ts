const window = {
   createStatusBarItem: jest.fn(() => ({
      show: jest.fn(),
   })),
   showErrorMessage: jest.fn(),
   showWarningMessage: jest.fn(),
   createTextEditorDecorationType: jest.fn(),
}

const workspace = {
   getConfiguration: jest.fn(),
   workspaceFolders: [],
   onDidSaveTextDocument: jest.fn(),
}

const debug = {
   onDidTerminateDebugSession: jest.fn(),
   startDebugging: jest.fn(),
}

const commands = {
   executeCommand: jest.fn(),
}

const context = {
   workspaceState: jest.fn(),
}

const vscode = {
   window,
   workspace,
   debug,
   commands,
   context,
}

module.exports = vscode
