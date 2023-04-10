export class ArrayUtils {
   private arrayDifference<T>(arr1: T[], arr2: T[]): T[] {
      return arr1.filter((x) => !arr2.includes(x))
   }

   public changesExist<T>(prev: T[], newArr: T[]): boolean {
      if (prev.length !== newArr.length) {
         return true
      }
      return newArr.every((value, index) => value === prev[index])
   }

   public elementsRemoved<T>(prev: T[], newArr: T[]): T[] {
      return this.arrayDifference(prev, newArr)
   }

   public elementsAdded<T>(prev: T[], newArr: T[]): T[] {
      return this.arrayDifference(newArr, prev)
   }

   public isStringArray(value: unknown): value is string[] {
      return (
         Array.isArray(value) && value.every((item) => typeof item === "string")
      )
   }
}
