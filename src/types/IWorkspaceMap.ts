export default interface IWorkspaceMap {
   [key: string]: string | string[] | undefined
   title: string
   fullPath: string
   categories?: string[]
   tags?: string[]
   outlinks?: string[]
   inlinks?: string[]
}
