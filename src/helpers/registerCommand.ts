import * as vscode from "vscode"

export interface ICommandParams {
   id: string
   callback: () => void
   outputMessage: string
}

/**
 *  Register VSCode commands and link to functionality contained in @param callback
 *  On execution of @param callback, log @param outputMessage to VSCode ouput console.
 */

export default function (
   params: ICommandParams,
   printChannelOutput: (message: string, isError: boolean) => void
): vscode.Disposable {
   return vscode.commands.registerCommand(params.id, () => {
      printChannelOutput(params.outputMessage, false)
      return params.callback()
   })
}
