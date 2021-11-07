import type { List, Any, Misc, Object } from 'ts-toolbelt'

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
> = Selector<Head<MergeParameters<S>>, Result, Tail<MergeParameters<S>>> &
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

/** Utility type to extract the State generic from a selector */
type GetStateFromSelector<S> = S extends Selector<infer State> ? State : never

/** Utility type to extract the State generic from multiple selectors at once,
 * to help ensure that all selectors correctly share the same State type and
 * avoid mismatched input selectors being provided.
 */
export type GetStateFromSelectors<S extends SelectorArray> =
  // handle two elements at once so this type works for up to 30 selectors
  S extends [infer C1, infer C2, ...infer Other]
    ? Other extends [any]
      ? GetStateFromSelector<C1> &
          GetStateFromSelector<C2> &
          GetStateFromSelectors<Other>
      : GetStateFromSelector<C1> & GetStateFromSelector<C2>
    : S extends [infer Current, ...infer Other]
    ? Other extends [any]
      ? GetStateFromSelector<Current> & GetStateFromSelectors<Other>
      : GetStateFromSelector<Current>
    : S extends (infer Elem)[]
    ? GetStateFromSelector<Elem>
    : never

export type LongestCompat<A extends any[], B extends any[]> = A extends [
  ...B,
  ...any[]
]
  ? A
  : B extends [...A, ...any[]]
  ? B
  : never

export type LongestParams<S extends SelectorArray> = S extends [
  (state: any, ...params: infer P1) => any,
  (state: any, ...params: infer P2) => any
]
  ? LongestCompat<P1, P2>
  : S extends [
      (state: any, ...params: infer P1) => any,
      (state: any, ...params: infer P2) => any,
      ...infer Rest
    ]
  ? LongestCompat<LongestCompat<P1, P2>, LongestParams<Rest & SelectorArray>>
  : S extends [(state: any, ...params: infer P) => any]
  ? P
  : never

/** Utility type to extract the Params generic from a selector */
export type GetParamsFromSelector<S> = S extends Selector<any, any, infer P>
  ? P extends []
    ? never
    : P
  : never

/** Utility type to extract the Params generic from multiple selectors at once,
 * to help ensure that all selectors correctly share the same params and
 * avoid mismatched input selectors being provided.
 */

export type GetParamsFromSelectors<S, Found = never> = _GetParamsFromSelectors<
  S,
  Found
>

export type _GetParamsFromSelectors<S, Found = never> = S extends SelectorArray
  ? S extends (infer s)[]
    ? GetParamsFromSelector<s>
    : S extends [infer Current, ...infer Rest]
    ? GetParamsFromSelector<Current> extends []
      ? _GetParamsFromSelectors<Rest, Found>
      : GetParamsFromSelector<Current>
    : S
  : Found

/*
export type GetParamsFromSelectors<S, Found = never> = IntersectionFromUnion<
  S extends SelectorArray
    ? S extends (infer s)[]
      ? GetParamsFromSelector<s>
      : S extends [infer Current, ...infer Rest]
      ? GetParamsFromSelector<Current> extends []
        ? GetParamsFromSelectors<Rest, Found>
        : GetParamsFromSelector<Current>
      : S
    : Found
>
*/

export type UnknownFunction = (...args: any[]) => any

export type ExtractParams<T extends readonly UnknownFunction[]> = {
  [index in keyof T]: T[index] extends T[number] ? Parameters<T[index]> : never
}

export type ExtractReturnType<T extends readonly UnknownFunction[]> = {
  [index in keyof T]: T[index] extends T[number] ? ReturnType<T[index]> : never
}

export type ExpandItems<T extends readonly unknown[]> = {
  [index in keyof T]: T[index] extends T[number]
    ? Any.Compute<T[index], 'deep'>
    : never
}

export type Head<T extends readonly any[]> = T extends [any, ...any[]]
  ? T[0]
  : never
export type Tail<T extends readonly any[]> = ((...t: T) => any) extends (
  _: any,
  ...tail: infer U
) => any
  ? U
  : []

type AllArrayKeys<A extends readonly any[]> = A extends any
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

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

export type IntersectArrays<T extends readonly any[]> = Id<
  UnionToIntersection<Mapped<T>>
>

export type MergeParameters<T extends readonly UnknownFunction[]> = ExpandItems<
  Object.ListOf<IntersectArrays<List.UnionOf<ExtractParams<T>>>>
>
// ExpandItems<
//   List.MergeAll<[], ExtractParams<T>, 'deep', Misc.BuiltIn>
// >

/** Utility type to extract the return type from a selector */
type SelectorReturnType<S> = S extends Selector ? ReturnType<S> : never

/** Utility type to extract the Result generic from multiple selectors at once,
 * for use in calculating the arguments to the "result/combiner" function.
 */
export type SelectorResultArray<
  Selectors extends SelectorArray,
  Rest extends SelectorArray = Selectors
> =
  // handle two elements at once so this type works for up to 29 selectors, not only up to 15
  Rest extends [infer S1, infer S2, ...infer Remaining]
    ? Remaining extends SelectorArray
      ? [
          SelectorReturnType<S1>,
          SelectorReturnType<S2>,
          ...SelectorResultArray<Selectors, Remaining>
        ]
      : [SelectorReturnType<S1>, SelectorReturnType<S2>]
    : Rest extends [infer S, ...infer Remaining]
    ? Remaining extends SelectorArray
      ? [SelectorReturnType<S>, ...SelectorResultArray<Selectors, Remaining>]
      : [SelectorReturnType<S>]
    : Rest extends ((...args: any) => infer S)[]
    ? S[]
    : []

/** A standard function returning true if two values are considered equal */
export type EqualityFn = (a: any, b: any) => boolean

/** Utility type to infer the type of "all params of a function except the first", so we can determine what arguments a memoize function accepts */
export type DropFirst<T extends unknown[]> = T extends [unknown, ...infer U]
  ? U
  : never
