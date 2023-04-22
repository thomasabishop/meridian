export class ArrayUtils {
   // Computes the difference between two arrays by returning a new array containing the elements that exist in arr1 but not in arr2 where both arrays of same type.
   private arrayDifference<T>(arr1: T[], arr2: T[]): T[] {
      return arr1.filter((x) => !arr2.includes(x))
   }

   // Compare two arrays of same type, determine if differences obtain
   public changesExist<T>(prev: T[], newArr: T[]): boolean {
      if (prev.length !== newArr.length) {
         return true
      }
      return newArr.every((value, index) => value === prev[index])
   }

   // Returns an array containing elements that have been removed from 'prev' when compared to 'newArr', using the arrayDifference() method.
   public elementsRemoved<T>(prev: T[], newArr: T[]): T[] {
      return this.arrayDifference(prev, newArr)
   }

   // Returns an array containing elements that have been added to 'newArr' when compared to 'prev', using the arrayDifference() method.
   public elementsAdded<T>(prev: T[], newArr: T[]): T[] {
      return this.arrayDifference(newArr, prev)
   }

   // Determine if every element of given array is of type string
   public isStringArray(value: unknown): value is string[] {
      return (
         Array.isArray(value) && value.every((item) => typeof item === "string")
      )
   }
}
