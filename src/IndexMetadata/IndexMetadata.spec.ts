import { IndexMetadata } from "./IndexMetadata"

describe("IndexMetadata", () => {
  const constructor = {
    projectRootDir: "rootDir",
  }
  const classInstance = new IndexMetadata(constructor.projectRootDir)

  describe("fileIsMd()", () => {
    it("should return `true` if passed a .md file", () => {
      let result = (classInstance as any).fileIsMd("/some/dir/test.md")
      expect(result).toBe(true)
    })
    it("should return `false` if passed a file that is not .md", () => {
      let result = (classInstance as any).fileIsMd("/some-dir/test.svg")
      expect(result).toBe(false)
    })
  })

  describe("parseFileTitle()", () => {
    it("should return space delimited title from file path", () => {
      let result = (classInstance as any).parseFileTitle("/some/dir/A_Title.md")
      expect(result).toBe("A Title")
    })
  })
})
