import * as vscode from "vscode"

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
   } else if (logtype === "warning") {
      reveal && outputChannel.show(true)
      outputChannel.appendLine(`[warning] ${content}`)
   } else {
      reveal && outputChannel.show(true)
      outputChannel.appendLine(content)
   }
}
