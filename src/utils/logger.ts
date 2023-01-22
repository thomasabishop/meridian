import * as vscode from "vscode"

//@ts-expect-error
let outputChannel: any = vscode.window.createOutputChannel("Meridian", {
   log: true,
})

export function printChannelOutput(
   content: string,
   reveal = false,
   logtype?: string
): void {
   if (logtype === "error") {
      outputChannel.show(true)
      outputChannel.error(content)
   } else {
      reveal && outputChannel.show(true)
      outputChannel.appendLine(content)
   }
}
