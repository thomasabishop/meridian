export default class ExtensionContext {
   workspaceState = new Map([["MERIDIAN", "value"]])

   get(key: string) {
      return new Promise((resolve, reject) => {
         if (!this.workspaceState.has(key)) {
            reject(undefined)
         }
         resolve(this.workspaceState.get(key))
      })
   }
}
