import { FileSystemUtils } from "./../FileSystemUtils"

describe("FileSystemUtils", () => {
   let instance: FileSystemUtils
   beforeEach(() => {
      instance = new FileSystemUtils("/path/root-path")
   })

   it("should set workspaceRoot property on initialisation", () => {
      expect((instance as any).workspaceRoot).toBeDefined()
   })

   describe("fileisMd()", () => {
      it("should return `true` if passed a .md file", () => {
         expect(instance.fileIsMd("/some/dir/test.md")).toBe(true)
      })
      it("should return `false` if passed a file that is not .md", () => {
         expect(instance.fileIsMd("/some-dir/test.svg")).toBe(false)
      })
   })

   describe("parseFileTitle()", () => {
      it("should return space delimited title from file path", () => {
         expect(instance.parseFileTitle("/some/dir/A_Title.md")).toBe("A Title")
      })
   })

   describe("removeRootPath()", () => {
      it("remove the root path string from a file path", () => {
         const result = instance.removeRootPath("/path/root-path/filename.md")
         expect(result).toBe("filename.md")
      })
      describe("removeRootPath() when projRoot is undefined", () => {
         beforeEach(() => {
            instance = new FileSystemUtils(undefined)
         })
         it("should return undefined", () => {
            const result = instance.removeRootPath(
               "/path/root-path/filename.md"
            )
            expect(result).toBe(undefined)
         })
      })
   })

   // To test if sub-method is called...
   //    it("should establish ", () => {
   //       const spy = jest.spyOn(instance, "parseFileTitle")
   //       expect(instance.fileIsMd("dfdf.md")).toBe(true)
   //       expect(spy).toHaveBeenCalled()
   //    })
})
