import * as vscode from "vscode"

export interface CommandParams {
   id: string
   callback: () => void
   outputMessage: string
}

export default function (
   params: CommandParams,
   printChannelOutput: (message: string, isError: boolean) => void
): vscode.Disposable {
   return vscode.commands.registerCommand(params.id, () => {
      printChannelOutput(params.outputMessage, false)
      return params.callback()
   })
}
