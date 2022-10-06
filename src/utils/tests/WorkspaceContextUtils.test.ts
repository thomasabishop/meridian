import { WorkspaceContextUtils } from "./../WorkspaceContextUtils"
import ExtensionContext from "./__mocks__/ExtensionContext"

describe("WorkspaceContextUtils", () => {
   let instance: WorkspaceContextUtils
   let mockContext: any
   beforeEach(() => {
      mockContext = new ExtensionContext()
      instance = new WorkspaceContextUtils(mockContext as any)
   })

   describe("readFromWorkspaceContext()", () => {
      it("should return value for key if entry exists", async () => {
         return expect(
            instance.readFromWorkspaceContext("MERIDIAN")
         ).resolves.toBe("value")
      })
      it("should return `undefined` if no match", async () => {
         return expect(
            instance.readFromWorkspaceContext("banana")
         ).resolves.toBe(undefined)
      })
   })
})
