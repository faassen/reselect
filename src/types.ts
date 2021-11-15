import type { Any } from 'ts-toolbelt'

/** A standard selector function, which takes three generic type arguments:
 * @param State The first value, often a Redux root state object
 * @param Result The final result returned by the selector
 * @param Params All additional arguments passed into the selector
 */
export type Selector<
  // The state can be anything
  State = any,
  // The result will be inferred
  Result = unknown,
  // There are either 0 params, or N params
  Params extends never | readonly any[] = any[]
  // If there are 0 params, type the function as just State in, Result out.
  // Otherwise, type it as State + Params in, Result out.
> = [Params] extends [never]
  ? (state: State) => Result
  : (state: State, ...params: Params) => Result
// > = (...params: Params) => Result

/** Selectors generated by Reselect have several additional fields attached: */
interface OutputSelectorFields<Combiner, Result> {
  /** The final function passed to `createSelector` */
  resultFunc: Combiner
  /** The same function, memoized */
  memoizedResultFunc: Combiner
  /** Returns the last result calculated by the selector */
  lastResult: () => Result
  /** An array of the input selectors */
  dependencies: SelectorArray
  /** Counts the number of times the output has been recalculated */
  recomputations: () => number
  /** Resets the count of recomputations count to 0 */
  resetRecomputations: () => number
}

/** Represents the actual selectors generated by `createSelector`.
 * The selector is:
 * - "a function that takes this state + params and returns a result"
 * - plus the attached additional fields
 */
export type OutputSelector<
  S extends SelectorArray,
  Result,
  Combiner,
  Params extends readonly any[] = never // MergeParameters<S>
> = Selector<GetStateFromSelectors<S>, Result, Params> &
  OutputSelectorFields<Combiner, Result>

/** A selector that is assumed to have one additional argument, such as
 * the props from a React component
 */
export type ParametricSelector<State, Props, Result> = Selector<
  State,
  Result,
  [Props, ...any]
>

/** A generated selector that is assumed to have one additional argument */
export type OutputParametricSelector<State, Props, Result, Combiner> =
  ParametricSelector<State, Props, Result> &
    OutputSelectorFields<Combiner, Result>

/** An array of input selectors */
export type SelectorArray = ReadonlyArray<Selector>

// TODO Uncomment these original Get*FromSelectors versions and comment out the ones below to see how the system behaved prior to these changes

// /** Utility type to extract the State generic from a selector */
// type GetStateFromSelector<S> = S extends Selector<infer State> ? State : never

// /** Utility type to extract the State generic from multiple selectors at once,
//  * to help ensure that all selectors correctly share the same State type and
//  * avoid mismatched input selectors being provided.
//  */
// export type GetStateFromSelectors<S extends SelectorArray> =
//   // handle two elements at once so this type works for up to 30 selectors
//   S extends [infer C1, infer C2, ...infer Other]
//     ? Other extends [any]
//       ? GetStateFromSelector<C1> &
//           GetStateFromSelector<C2> &
//           GetStateFromSelectors<Other>
//       : GetStateFromSelector<C1> & GetStateFromSelector<C2>
//     : S extends [infer Current, ...infer Other]
//     ? Other extends [any]
//       ? GetStateFromSelector<Current> & GetStateFromSelectors<Other>
//       : GetStateFromSelector<Current>
//     : S extends (infer Elem)[]
//     ? GetStateFromSelector<Elem>
//     : never

// /** Utility type to extract the Params generic from a selector */
// export type GetParamsFromSelector<S> = S extends Selector<any, any, infer P>
//   ? P extends []
//     ? never
//     : P
//   : never

// /** Utility type to extract the Params generic from multiple selectors at once,
//  * to help ensure that all selectors correctly share the same params and
//  * avoid mismatched input selectors being provided.
//  */
// export type GetParamsFromSelectors<S, Found = never> = S extends SelectorArray
//   ? S extends (infer s)[]
//     ? GetParamsFromSelector<s>
//     : S extends [infer Current, ...infer Rest]
//     ? GetParamsFromSelector<Current> extends []
//       ? GetParamsFromSelectors<Rest, Found>
//       : GetParamsFromSelector<Current>
//     : S
//   : Found

export type GetStateFromSelectors<S extends SelectorArray> = // Head<
  MergeParameters<S>[0]
// >

type EmptyObject = {
  [K in any]: never
}

export type Tail42<A> = A extends [any, ...infer Rest] ? Rest : never

export type GetParamsFromSelectors<
  S extends SelectorArray,
  RemainingItems extends readonly unknown[] = Tail42<MergeParameters<S>>
  // >
  // This seems to default to an array containing an empty object, which is
  // not meaningful and causes problems with the `Selector/OutputSelector` types.
  // Force it to have a meaningful value, or cancel it out.
  // TODO Use `MergeParameters<S>` instead and hover a selector to see all params being extracted by MergeParameters
> = RemainingItems extends [EmptyObject] ? never : RemainingItems

export type UnknownFunction = (...args: any[]) => any

export type ExtractParams<T extends readonly UnknownFunction[]> = {
  [index in keyof T]: T[index] extends T[number] ? Parameters<T[index]> : never
}

export type ExtractReturnType<T extends readonly UnknownFunction[]> = {
  [index in keyof T]: T[index] extends T[number] ? ReturnType<T[index]> : never
}

type ExtractArray<A extends unknown[], T extends { [key: number]: any }> = {
  [index in keyof T & keyof A]: T[index] extends T[number] ? T[index] : never
}

export type ExpandItems<T extends readonly unknown[]> = {
  [index in keyof T]: T[index] extends T[number]
    ? Any.Compute<T[index], 'deep'>
    : never
}

export type Head<T extends any[]> = T extends [any, ...any[]] ? T[0] : never
export type Tail<T extends any[]> = ((...t: T) => any) extends (
  _: any,
  ...tail: infer U
) => any
  ? U
  : []

export type AllArrayKeys<A extends readonly any[]> = A extends any
  ? {
      [K in keyof A]: K
    }[number]
  : never

type Mapped<A extends readonly any[]> = AllArrayKeys<A> extends infer Keys
  ? A extends any
    ? {
        [K in Keys & (string | number)]: K extends keyof A ? A[K] : unknown
      }
    : never
  : never

type Id<T> = { [K in keyof T]: T[K] } & {}

/*
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never
*/
export type UnionToIntersection<Union> = (
  // `extends unknown` is always going to be the case and is used to convert the
  // `Union` into a [distributive conditional
  // type](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types).
  Union extends unknown
    ? // The union type is used as the only argument to a function since the union
      // of function arguments is an intersection.
      (distributedUnion: Union) => void
    : // This won't happen.
      never
      // Infer the `Intersection` type since TypeScript represents the positional
      // arguments of unions of functions as an intersection of the union.
) extends (mergedIntersection: infer Intersection) => void
  ? Intersection
  : never

export type IntersectArrays<T extends readonly any[]> = Id<
  UnionToIntersection<Mapped<T>>
>

type RemoveNames<T extends readonly any[]> = [any, ...T] extends [
  any,
  ...infer U
]
  ? U
  : never

export type Bool = '0' | '1'
export type Obj<T> = { [k: string]: T }
export type And<A extends Bool, B extends Bool> = ({
  1: { 1: '1' } & Obj<'0'>
} & Obj<Obj<'0'>>)[A][B]

export type Matches<V, T> = V extends T ? '1' : '0'
export type IsArrayType<T> = Matches<T, any[]>

export type Not<T extends Bool> = { '1': '0'; '0': '1' }[T]
export type InstanceOf<V, T> = And<Matches<V, T>, Not<Matches<T, V>>>
export type IsTuple<T extends { length: number }> = And<
  IsArrayType<T>,
  InstanceOf<T['length'], number>
>

export type Has<U, U1> = [U1] extends [U] ? 1 : 0

export type List<A = any> = ReadonlyArray<A>

export type Longest<L extends List, L1 extends List> = L extends unknown
  ? L1 extends unknown
    ? { 0: L1; 1: L }[Has<keyof L, keyof L1>]
    : never
  : never

export type LongestArray<S extends readonly any[][]> = IsTuple<S> extends '0'
  ? S[0]
  : S extends [any[], any[]]
  ? Longest<S[0], S[1]>
  : S extends [any[], any[], ...infer Rest]
  ? Longest<Longest<S[0], S[1]>, Rest extends any[][] ? LongestArray<Rest> : []>
  : S extends [any[]]
  ? S[0]
  : never

type Props = { bar: number }

type Intersectioned<T extends unknown[]> = {
  [index in keyof T]: T[index] extends T[number]
    ? UnionToIntersection<[T[index]]>
    : never
}

export type Cast<T, P, D extends P = P> = T extends P ? T : D

type IndexedLookup<A extends readonly any[], K extends AllArrayKeys<A>> = A[K]

// type UnionLength<T> = (keyof T)['length']

type Merge<T extends any[]> = NonNullable<
  T[number] extends infer U
    ? U extends any
      ? UnionToIntersection<U>
      : never
    : never
>

type IntersectAll<T extends any[]> = IsTuple<T> extends '0'
  ? T[0]
  : _IntersectAll<T>

type _IntersectAll<T, R = unknown> = T extends [infer First, ...infer Rest]
  ? _IntersectAll<Rest, undefined extends First ? R : R & First>
  : R
export type Inc = {
  [i: number]: number
  0: 1
  1: 2
  2: 3
  3: 4
  4: 5
  5: 6
  6: 7
  7: 8
  8: 9
  9: 10
}

export type TupleHasIndex<Arr extends List<any>, I extends number> = ({
  [K in keyof Arr]: '1'
} & Array<'0'>)[I]
export type TupleFrom<
  T extends List<any>,
  I extends number,
  Acc extends List<any> = []
> = { 0: Acc; 1: TupleFrom<T, Inc[I], [...Acc, T[I]]> }[TupleHasIndex<T, I>]

type Push<T extends any[], V> = [...T, V]

type LastOf<T> = UnionToIntersection<
  T extends any ? () => T : never
> extends () => infer R
  ? R
  : never

// TS4.1+
type TuplifyUnion<
  T,
  L = LastOf<T>,
  N = [T] extends [never] ? true : false
> = true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>

type Transpose<T> = T[Extract<
  keyof T,
  T extends readonly any[] ? number : unknown
>] extends infer V
  ? {
      [K in keyof V]: {
        [L in keyof T]: K extends keyof T[L] ? T[L][K] : undefined
      }
    }
  : never

export type MergeParameters<
  T extends readonly UnknownFunction[],
  ParamsArrays extends readonly any[][] = ExtractParams<T>,
  TransposedArrays = Transpose<ParamsArrays>,
  TuplifiedArrays extends any[] = TuplifyUnion<TransposedArrays>,
  LongestParamsArray extends readonly any[] = LongestArray<TuplifiedArrays>,
  PAN extends readonly any[] = ParamsArrays[number]
> = ExpandItems<
  // LongestParamsArray
  RemoveNames<{
    [index in keyof LongestParamsArray]: LongestParamsArray[index] extends LongestParamsArray[number]
      ? IntersectAll<LongestParamsArray[index]>
      : // TODO Use IntersectAll here instead of UnionToIntersection
        // IntersectAll<
        // TupleFrom<NonNullable<PAN[index & AllArrayKeys<PAN>]>, LongestParamsArray['length']>
        // >
        never
  }>
>

// ExpandItems<
//   RemoveNames<{
//     [index in keyof LongestParamsArray]: LongestParamsArray[index] extends LongestParamsArray[number]
//       ? // TODO Use IntersectAll here instead of UnionToIntersection
//       // IntersectAll<
//         TupleFrom<NonNullable<PAN[index & AllArrayKeys<PAN>]>, LongestParamsArray['length']>
//        // >
//        : never
//   }>
// >

// export type MergeParameters<T extends readonly UnknownFunction[]> = ExpandItems<
//   // RemoveNames<List.MergeAll<[], ExtractParams<T>, 'deep', Misc.BuiltIn>>
//   Object.ListOf<IntersectArrays<List.UnionOf<ExtractParams<T>>>>

//   // ExpandItems<
// >

export type SelectorResultArray<Selectors extends SelectorArray> =
  ExtractReturnType<Selectors>

/** A standard function returning true if two values are considered equal */
export type EqualityFn = (a: any, b: any) => boolean

/** Utility type to infer the type of "all params of a function except the first", so we can determine what arguments a memoize function accepts */
export type DropFirst<T extends unknown[]> = T extends [unknown, ...infer U]
  ? U
  : never
