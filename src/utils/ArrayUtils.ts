export class ArrayUtils {
   public changesExist(prev: unknown[], newArr: unknown[]): boolean {
      if (prev.length !== newArr.length) {
         return true
      }
      return newArr.every((value, index) => value === prev[index])
   }

   public elementsRemoved(prev: unknown[], newArr: unknown[]): unknown[] {
      return prev.filter((x: unknown) => !newArr.includes(x))
   }

   public elementsAdded(prev: unknown[], newArr: unknown[]): unknown[] {
      return newArr.filter((x: unknown) => !prev.includes(x))
   }

   public isStringArray(value: unknown): value is string[] {
      return (
         Array.isArray(value) && value.every((item) => typeof item === "string")
      )
   }
}
