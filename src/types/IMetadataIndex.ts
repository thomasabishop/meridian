export default interface IMetadataIndex {
   token: string
   files: {
      filePath: string
      fileTitle?: string | undefined
   }[]
}
