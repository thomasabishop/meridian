/**
 * Shorthand for creating a union of all possible property value types for a given interface. Analagouse to the way `keyof` returns the union of possible property key types.
 * I think this is a bit more explanatory than a long return typoe of primitive and reference types, i.e `: Promise<string | string[] | boolean | undefined> for every possible value for an interface but construct does not exist in TS.
 * Example usage:
 * `type ValueofIMyInterface = ValueOf<IMyInterface>`
 * See for discussion: https://stackoverflow.com/a/49286056/10484600
 */

export type ValueOf<T> = T[keyof T]
