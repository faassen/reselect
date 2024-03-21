import memoizeOne from 'memoize-one'
import microMemoize from 'micro-memoize'
import {
  unstable_autotrackMemoize as autotrackMemoize,
  createSelector,
  createSelectorCreator,
  lruMemoize,
  weakMapMemoize,
} from 'reselect'
import { expectExactType } from './typesTestUtils'

interface RootState {
  todos: {
    id: number
    completed: boolean
  }[]
}
const state: RootState = {
  todos: [
    { id: 0, completed: false },
    { id: 1, completed: false },
  ],
}

function overrideOnlyMemoizeInCreateSelector() {
  const selectorDefaultSeparateInlineArgs = createSelector(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { memoize: lruMemoize },
  )
  const selectorDefaultArgsAsArray = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(t => t.id),
    { memoize: lruMemoize },
  )
  const selectorDefaultArgsAsArrayWithMemoizeOptions = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(t => t.id),
    { memoize: lruMemoize, memoizeOptions: { maxSize: 2 } },
  )
  const selectorDefaultSeparateInlineArgsWithMemoizeOptions = createSelector(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { memoize: lruMemoize, memoizeOptions: { maxSize: 2 } },
  )
  const selectorAutotrackSeparateInlineArgs = createSelector(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { memoize: autotrackMemoize },
  )
  const selectorAutotrackArgsAsArray = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(t => t.id),
    { memoize: autotrackMemoize },
  )
  // @ts-expect-error When memoize is autotrackMemoize, type of memoizeOptions needs to be the same as options args in autotrackMemoize.
  const selectorAutotrackArgsAsArrayWithMemoizeOptions = createSelector(
    [(state: RootState) => state.todos],
    // @ts-expect-error
    todos => todos.map(t => t.id),
    { memoize: autotrackMemoize, memoizeOptions: { maxSize: 2 } },
  )
  // @ts-expect-error When memoize is autotrackMemoize, type of memoizeOptions needs to be the same as options args in autotrackMemoize.
  const selectorAutotrackSeparateInlineArgsWithMemoizeOptions = createSelector(
    (state: RootState) => state.todos,
    // @ts-expect-error
    todos => todos.map(t => t.id),
    { memoize: autotrackMemoize, memoizeOptions: { maxSize: 2 } },
  )
  const selectorWeakMapSeparateInlineArgs = createSelector(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { memoize: weakMapMemoize },
  )
  const selectorWeakMapArgsAsArray = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(t => t.id),
    { memoize: weakMapMemoize },
  )
  // @ts-expect-error When memoize is weakMapMemoize, type of memoizeOptions needs to be the same as options args in weakMapMemoize.
  const selectorWeakMapArgsAsArrayWithMemoizeOptions = createSelector(
    [(state: RootState) => state.todos],
    // @ts-expect-error
    todos => todos.map(t => t.id),
    { memoize: weakMapMemoize, memoizeOptions: { maxSize: 2 } },
  )
  // @ts-expect-error When memoize is weakMapMemoize, type of memoizeOptions needs to be the same as options args in weakMapMemoize.
  const selectorWeakMapSeparateInlineArgsWithMemoizeOptions = createSelector(
    (state: RootState) => state.todos,
    // @ts-expect-error
    todos => todos.map(t => t.id),
    { memoize: weakMapMemoize, memoizeOptions: { maxSize: 2 } },
  )
  const createSelectorDefault = createSelectorCreator(lruMemoize)
  const createSelectorWeakMap = createSelectorCreator(weakMapMemoize)
  const createSelectorAutotrack = createSelectorCreator(autotrackMemoize)
  const changeMemoizeMethodSelectorDefault = createSelectorDefault(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { memoize: weakMapMemoize },
  )
  const changeMemoizeMethodSelectorWeakMap = createSelectorWeakMap(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { memoize: lruMemoize },
  )
  const changeMemoizeMethodSelectorAutotrack = createSelectorAutotrack(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { memoize: lruMemoize },
  )
  const changeMemoizeMethodSelectorDefaultWithMemoizeOptions =
    // @ts-expect-error When memoize is changed to weakMapMemoize or autotrackMemoize, memoizeOptions cannot be the same type as options args in lruMemoize.
    createSelectorDefault(
      (state: RootState) => state.todos,
      // @ts-expect-error
      todos => todos.map(t => t.id),
      { memoize: weakMapMemoize, memoizeOptions: { maxSize: 2 } },
    )
  const changeMemoizeMethodSelectorWeakMapWithMemoizeOptions =
    createSelectorWeakMap(
      (state: RootState) => state.todos,
      todos => todos.map(t => t.id),
      { memoize: lruMemoize, memoizeOptions: { maxSize: 2 } }, // When memoize is changed to lruMemoize, memoizeOptions can now be the same type as options args in lruMemoize.
    )
  const changeMemoizeMethodSelectorAutotrackWithMemoizeOptions =
    createSelectorAutotrack(
      (state: RootState) => state.todos,
      todos => todos.map(t => t.id),
      { memoize: lruMemoize, memoizeOptions: { maxSize: 2 } }, // When memoize is changed to lruMemoize, memoizeOptions can now be the same type as options args in lruMemoize.
    )
}

function overrideOnlyArgsMemoizeInCreateSelector() {
  const selectorDefaultSeparateInlineArgs = createSelector(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { argsMemoize: lruMemoize },
  )
  const selectorDefaultArgsAsArray = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(t => t.id),
    { argsMemoize: lruMemoize },
  )
  const selectorDefaultArgsAsArrayWithMemoizeOptions = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(t => t.id),
    { argsMemoize: lruMemoize, argsMemoizeOptions: { maxSize: 2 } },
  )
  const selectorDefaultSeparateInlineArgsWithMemoizeOptions = createSelector(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { argsMemoize: lruMemoize, argsMemoizeOptions: { maxSize: 2 } },
  )
  const selectorAutotrackSeparateInlineArgs = createSelector(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { argsMemoize: autotrackMemoize },
  )
  const selectorAutotrackArgsAsArray = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(t => t.id),
    { argsMemoize: autotrackMemoize },
  )
  // @ts-expect-error When argsMemoize is autotrackMemoize, type of argsMemoizeOptions needs to be the same as options args in autotrackMemoize.
  const selectorAutotrackArgsAsArrayWithMemoizeOptions = createSelector(
    [(state: RootState) => state.todos],
    // @ts-expect-error
    todos => todos.map(t => t.id),
    {
      argsMemoize: autotrackMemoize,
      argsMemoizeOptions: { maxSize: 2 },
    },
  )
  // @ts-expect-error When argsMemoize is autotrackMemoize, type of argsMemoizeOptions needs to be the same as options args in autotrackMemoize.
  const selectorAutotrackSeparateInlineArgsWithMemoizeOptions = createSelector(
    (state: RootState) => state.todos,
    // @ts-expect-error
    todos => todos.map(t => t.id),
    {
      argsMemoize: autotrackMemoize,
      argsMemoizeOptions: { maxSize: 2 },
    },
  )
  const selectorWeakMapSeparateInlineArgs = createSelector(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { argsMemoize: weakMapMemoize },
  )
  const selectorWeakMapArgsAsArray = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(t => t.id),
    { argsMemoize: weakMapMemoize },
  )
  // @ts-expect-error When argsMemoize is weakMapMemoize, type of argsMemoizeOptions needs to be the same as options args in weakMapMemoize.
  const selectorWeakMapArgsAsArrayWithMemoizeOptions = createSelector(
    [(state: RootState) => state.todos],
    // @ts-expect-error
    todos => todos.map(t => t.id),
    { argsMemoize: weakMapMemoize, argsMemoizeOptions: { maxSize: 2 } },
  )
  // @ts-expect-error When argsMemoize is weakMapMemoize, type of argsMemoizeOptions needs to be the same as options args in weakMapMemoize.
  const selectorWeakMapSeparateInlineArgsWithMemoizeOptions = createSelector(
    (state: RootState) => state.todos,
    // @ts-expect-error
    todos => todos.map(t => t.id),
    { argsMemoize: weakMapMemoize, argsMemoizeOptions: { maxSize: 2 } },
  )
  // @ts-expect-error When argsMemoize is weakMapMemoize, type of argsMemoizeOptions needs to be the same as options args in weakMapMemoize.
  const selectorWeakMapSeparateInlineArgsWithMemoizeOptions1 = createSelector(
    [
      (state: RootState) => state.todos,
      // @ts-expect-error
      todos => todos.map(t => t.id),
    ],
    {
      argsMemoize: weakMapMemoize,
      argsMemoizeOptions: { maxSize: 2 },
    },
  )
  // @ts-expect-error When argsMemoize is weakMapMemoize, type of argsMemoizeOptions needs to be the same as options args in weakMapMemoize.
  const selectorWeakMapSeparateInlineArgsWithMemoizeOptions2 = createSelector(
    (state: RootState) => state.todos,
    // @ts-expect-error
    todos => todos.map(t => t.id),
    {
      memoize: lruMemoize,
      argsMemoize: weakMapMemoize,
      memoizeOptions: {
        equalityCheck:
          // @ts-expect-error
          (a, b) => a === b,
        maxSize: 2,
      },
      argsMemoizeOptions: { maxSize: 2 },
    },
  )

  const createSelectorLruMemoize = createSelectorCreator({
    memoize: lruMemoize,
  })
  const selectorWeakMapSeparateInlineArgsWithMemoizeOptions3 =
    // @ts-expect-error When argsMemoize is weakMapMemoize, type of argsMemoizeOptions needs to be the same as options args in weakMapMemoize.
    createSelectorLruMemoize(
      (state: RootState) => state.todos,
      // @ts-expect-error
      todos => todos.map(t => t.id),
      {
        memoize: lruMemoize,
        argsMemoize: weakMapMemoize,
        // memoizeOptions: [],
        memoizeOptions: [
          {
            equalityCheck:
              // @ts-expect-error
              (a, b) => a === b,
            maxSize: 2,
          },
        ],
        argsMemoizeOptions: [{ maxSize: 2 }],
      },
    )

  const selectorWeakMapSeparateInlineArgsWithMemoizeOptions5 =
    // @ts-expect-error
    createSelectorLruMemoize(
      [(state: RootState) => state.todos],
      // @ts-expect-error
      todos => todos.map(t => t.id),
      {
        argsMemoize: weakMapMemoize,
        memoizeOptions: [{ isPromise: false }],
        argsMemoizeOptions: [],
      },
    )
  const selectorWeakMapSeparateInlineArgsWithMemoizeOptions6 =
    createSelectorLruMemoize(
      (state: RootState) => state.todos,
      todos => todos.map(t => t.id),
      {
        argsMemoize: weakMapMemoize,
        memoize: weakMapMemoize,
        memoizeOptions: [],
        argsMemoizeOptions: [],
        // argsMemoizeOptions: (a, b) => a === b
      },
    )
  const createSelectorDefault = createSelectorCreator(lruMemoize)
  const createSelectorWeakMap = createSelectorCreator(weakMapMemoize)
  const createSelectorAutotrack = createSelectorCreator(autotrackMemoize)
  const changeMemoizeMethodSelectorDefault = createSelectorDefault(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { argsMemoize: weakMapMemoize },
  )
  const changeMemoizeMethodSelectorWeakMap = createSelectorWeakMap(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { argsMemoize: lruMemoize },
  )
  const changeMemoizeMethodSelectorAutotrack = createSelectorAutotrack(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    { argsMemoize: lruMemoize },
  )
  const changeMemoizeMethodSelectorDefaultWithMemoizeOptions =
    // @ts-expect-error When argsMemoize is changed to weakMapMemoize or autotrackMemoize, argsMemoizeOptions cannot be the same type as options args in lruMemoize.
    createSelectorDefault(
      (state: RootState) => state.todos,
      // @ts-expect-error
      todos => todos.map(t => t.id),
      { argsMemoize: weakMapMemoize, argsMemoizeOptions: { maxSize: 2 } },
    )
  const changeMemoizeMethodSelectorWeakMapWithMemoizeOptions =
    createSelectorWeakMap(
      (state: RootState) => state.todos,
      todos => todos.map(t => t.id),
      { argsMemoize: lruMemoize, argsMemoizeOptions: { maxSize: 2 } }, // When argsMemoize is changed to lruMemoize, argsMemoizeOptions can now be the same type as options args in lruMemoize.
    )
  const changeMemoizeMethodSelectorAutotrackWithMemoizeOptions =
    createSelectorAutotrack(
      (state: RootState) => state.todos,
      todos => todos.map(t => t.id),
      { argsMemoize: lruMemoize, argsMemoizeOptions: { maxSize: 2 } }, // When argsMemoize is changed to lruMemoize, argsMemoizeOptions can now be the same type as options args in lruMemoize.
    )
}

function overrideMemoizeAndArgsMemoizeInCreateSelector() {
  const createSelectorMicroMemoize = createSelectorCreator({
    memoize: microMemoize,
    memoizeOptions: [{ isEqual: (a, b) => a === b }],
    // memoizeOptions: { isEqual: (a, b) => a === b },
    argsMemoize: microMemoize,
    argsMemoizeOptions: { isEqual: (a, b) => a === b },
  })
  const selectorMicroMemoize = createSelectorMicroMemoize(
    (state: RootState) => state.todos,
    todos => todos.map(({ id }) => id),
  )
  expectExactType<number[]>(selectorMicroMemoize(state))
  // @ts-expect-error
  selectorMicroMemoize()
  // Checking existence of fields related to `argsMemoize`
  selectorMicroMemoize.cache
  selectorMicroMemoize.fn()
  selectorMicroMemoize.isMemoized
  selectorMicroMemoize.options
  // @ts-expect-error
  selectorMicroMemoize.clearCache()
  // Checking existence of fields related to `memoize`
  selectorMicroMemoize.memoizedResultFunc.cache
  selectorMicroMemoize.memoizedResultFunc.fn()
  selectorMicroMemoize.memoizedResultFunc.isMemoized
  selectorMicroMemoize.memoizedResultFunc.options
  // @ts-expect-error
  selectorMicroMemoize.memoizedResultFunc.clearCache()
  // Checking existence of fields related to the actual memoized selector
  selectorMicroMemoize.dependencies
  expectExactType<
    [
      (state: RootState) => {
        id: number
        completed: boolean
      }[],
    ]
  >(selectorMicroMemoize.dependencies)
  expectExactType<number[]>(selectorMicroMemoize.lastResult())
  // @ts-expect-error
  selectorMicroMemoize.memoizedResultFunc()
  expectExactType<number[]>(
    selectorMicroMemoize.memoizedResultFunc([{ id: 0, completed: true }]),
  )
  selectorMicroMemoize.recomputations()
  selectorMicroMemoize.resetRecomputations()
  // @ts-expect-error
  selectorMicroMemoize.resultFunc()
  expectExactType<number[]>(
    selectorMicroMemoize.resultFunc([{ id: 0, completed: true }]),
  )

  // Checking to see if types dynamically change if memoize or argsMemoize are overridden inside `createSelector`.
  // `microMemoize` was initially passed into `createSelectorCreator`
  // as `memoize` and `argsMemoize`, After overriding them both to `lruMemoize`,
  // not only does the type for `memoizeOptions` and `argsMemoizeOptions` change to
  // the options parameter of `lruMemoize`, the output selector fields
  // also change their type to the return type of `lruMemoize`.
  const selectorMicroMemoizeOverridden = createSelectorMicroMemoize(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    {
      memoize: lruMemoize,
      argsMemoize: lruMemoize,
      memoizeOptions: { equalityCheck: (a, b) => a === b, maxSize: 2 },
      argsMemoizeOptions: { equalityCheck: (a, b) => a === b, maxSize: 3 },
    },
  )
  expectExactType<number[]>(selectorMicroMemoizeOverridden(state))
  // @ts-expect-error
  selectorMicroMemoizeOverridden()
  // Checking existence of fields related to `argsMemoize`
  selectorMicroMemoizeOverridden.clearCache() // Prior to override, this field did NOT exist.
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverridden.cache
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverridden.fn()
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverridden.isMemoized
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverridden.options
  // Checking existence of fields related to `memoize`
  selectorMicroMemoizeOverridden.memoizedResultFunc.clearCache() // Prior to override, this field did NOT exist.
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverridden.memoizedResultFunc.cache
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverridden.memoizedResultFunc.fn()
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverridden.memoizedResultFunc.isMemoized
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverridden.memoizedResultFunc.options
  // Checking existence of fields related to the actual memoized selector
  expectExactType<
    [
      (state: RootState) => {
        id: number
        completed: boolean
      }[],
    ]
  >(selectorMicroMemoizeOverridden.dependencies)
  expectExactType<number[]>(
    selectorMicroMemoizeOverridden.memoizedResultFunc([
      { id: 0, completed: true },
    ]),
  )
  // @ts-expect-error
  selectorMicroMemoizeOverridden.memoizedResultFunc()
  selectorMicroMemoizeOverridden.recomputations()
  selectorMicroMemoizeOverridden.resetRecomputations()
  // @ts-expect-error
  selectorMicroMemoizeOverridden.resultFunc()
  expectExactType<number[]>(
    selectorMicroMemoizeOverridden.resultFunc([{ id: 0, completed: true }]),
  )
  // Making sure the type behavior is consistent when args are passed in as an array.
  const selectorMicroMemoizeOverriddenArray = createSelectorMicroMemoize(
    [(state: RootState) => state.todos],
    todos => todos.map(({ id }) => id),
    {
      memoize: lruMemoize,
      argsMemoize: lruMemoize,
      memoizeOptions: { equalityCheck: (a, b) => a === b, maxSize: 2 },
      argsMemoizeOptions: { equalityCheck: (a, b) => a === b, maxSize: 3 },
    },
  )
  expectExactType<number[]>(selectorMicroMemoizeOverriddenArray(state))
  // @ts-expect-error
  selectorMicroMemoizeOverriddenArray()
  // Checking existence of fields related to `argsMemoize`
  selectorMicroMemoizeOverriddenArray.clearCache() // Prior to override, this field did NOT exist.
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverriddenArray.cache
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverriddenArray.fn()
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverriddenArray.isMemoized
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverriddenArray.options
  // Checking existence of fields related to `memoize`
  selectorMicroMemoizeOverriddenArray.memoizedResultFunc.clearCache() // Prior to override, this field did NOT exist.
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverriddenArray.memoizedResultFunc.cache
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverriddenArray.memoizedResultFunc.fn()
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverriddenArray.memoizedResultFunc.isMemoized
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverriddenArray.memoizedResultFunc.options
  // Checking existence of fields related to the actual memoized selector
  expectExactType<
    [
      (state: RootState) => {
        id: number
        completed: boolean
      }[],
    ]
  >(selectorMicroMemoizeOverriddenArray.dependencies)
  expectExactType<number[]>(
    selectorMicroMemoizeOverriddenArray.memoizedResultFunc([
      { id: 0, completed: true },
    ]),
  )
  // @ts-expect-error
  selectorMicroMemoizeOverriddenArray.memoizedResultFunc()
  selectorMicroMemoizeOverriddenArray.recomputations()
  selectorMicroMemoizeOverriddenArray.resetRecomputations()
  // @ts-expect-error
  selectorMicroMemoizeOverriddenArray.resultFunc()
  expectExactType<number[]>(
    selectorMicroMemoizeOverriddenArray.resultFunc([
      { id: 0, completed: true },
    ]),
  )
  const selectorMicroMemoizeOverrideArgsMemoizeOnlyWrong =
    // @ts-expect-error Because `memoizeOptions` should not contain `resultEqualityCheck`.
    createSelectorMicroMemoize(
      (state: RootState) => state.todos,
      todos => todos.map(({ id }) => id),
      {
        argsMemoize: lruMemoize,
        memoizeOptions: {
          isPromise: false,
          resultEqualityCheck:
            // @ts-expect-error
            (a, b) => a === b,
        },
        argsMemoizeOptions: { resultEqualityCheck: (a, b) => a === b },
      },
    )
  const selectorMicroMemoizeOverrideArgsMemoizeOnly =
    createSelectorMicroMemoize(
      (state: RootState) => state.todos,
      todos => todos.map(({ id }) => id),
      {
        argsMemoize: lruMemoize,
        memoizeOptions: { isPromise: false },
        argsMemoizeOptions: { resultEqualityCheck: (a, b) => a === b },
      },
    )
  expectExactType<number[]>(selectorMicroMemoizeOverrideArgsMemoizeOnly(state))
  // @ts-expect-error
  selectorMicroMemoizeOverrideArgsMemoizeOnly()
  // Checking existence of fields related to `argsMemoize`
  selectorMicroMemoizeOverrideArgsMemoizeOnly.clearCache() // Prior to override, this field did NOT exist.
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverrideArgsMemoizeOnly.cache
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverrideArgsMemoizeOnly.fn()
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverrideArgsMemoizeOnly.isMemoized
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverrideArgsMemoizeOnly.options

  // Checking existence of fields related to `memoize`, these should still be the same.
  selectorMicroMemoizeOverrideArgsMemoizeOnly.memoizedResultFunc.cache
  selectorMicroMemoizeOverrideArgsMemoizeOnly.memoizedResultFunc.fn()
  selectorMicroMemoizeOverrideArgsMemoizeOnly.memoizedResultFunc.isMemoized
  selectorMicroMemoizeOverrideArgsMemoizeOnly.memoizedResultFunc.options
  // @ts-expect-error Note that since we did not override `memoize` in the options object,
  // `memoizedResultFunc.clearCache` is still an invalid field access.
  selectorMicroMemoizeOverrideArgsMemoizeOnly.memoizedResultFunc.clearCache()
  // Checking existence of fields related to the actual memoized selector
  expectExactType<
    [
      (state: RootState) => {
        id: number
        completed: boolean
      }[],
    ]
  >(selectorMicroMemoizeOverrideArgsMemoizeOnly.dependencies)
  expectExactType<number[]>(
    selectorMicroMemoizeOverrideArgsMemoizeOnly.lastResult(),
  )
  expectExactType<number[]>(
    selectorMicroMemoizeOverrideArgsMemoizeOnly.memoizedResultFunc([
      { id: 0, completed: true },
    ]),
  )
  // @ts-expect-error
  selectorMicroMemoizeOverrideArgsMemoizeOnly.memoizedResultFunc()
  selectorMicroMemoizeOverrideArgsMemoizeOnly.recomputations()
  selectorMicroMemoizeOverrideArgsMemoizeOnly.resetRecomputations()
  // @ts-expect-error
  selectorMicroMemoizeOverrideArgsMemoizeOnly.resultFunc()
  expectExactType<number[]>(
    selectorMicroMemoizeOverrideArgsMemoizeOnly.resultFunc([
      { id: 0, completed: true },
    ]),
  )

  const selectorMicroMemoizeOverrideMemoizeOnly = createSelectorMicroMemoize(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    {
      memoize: lruMemoize,
      memoizeOptions: { resultEqualityCheck: (a, b) => a === b },
    },
  )
  expectExactType<number[]>(selectorMicroMemoizeOverrideMemoizeOnly(state))
  // @ts-expect-error
  selectorMicroMemoizeOverrideMemoizeOnly()

  // Checking existence of fields related to `argsMemoize`
  selectorMicroMemoizeOverrideMemoizeOnly.cache
  selectorMicroMemoizeOverrideMemoizeOnly.fn
  selectorMicroMemoizeOverrideMemoizeOnly.isMemoized
  selectorMicroMemoizeOverrideMemoizeOnly.options
  // @ts-expect-error Note that since we did not override `argsMemoize` in the options object,
  // `selector.clearCache` is still an invalid field access.
  selectorMicroMemoizeOverrideMemoizeOnly.clearCache()

  // Checking existence of fields related to `memoize`
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverrideMemoizeOnly.memoizedResultFunc.cache
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverrideMemoizeOnly.memoizedResultFunc.fn()
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverrideMemoizeOnly.memoizedResultFunc.isMemoized
  // @ts-expect-error Prior to override, this field DID exist.
  selectorMicroMemoizeOverrideMemoizeOnly.memoizedResultFunc.options
  selectorMicroMemoizeOverrideMemoizeOnly.memoizedResultFunc.clearCache() // Prior to override, this field did NOT exist.

  // Checking existence of fields related to the actual memoized selector
  expectExactType<
    [
      (state: RootState) => {
        id: number
        completed: boolean
      }[],
    ]
  >(selectorMicroMemoizeOverrideMemoizeOnly.dependencies)
  expectExactType<number[]>(
    selectorMicroMemoizeOverrideMemoizeOnly.lastResult(),
  )
  expectExactType<number[]>(
    selectorMicroMemoizeOverrideMemoizeOnly.memoizedResultFunc([
      { id: 0, completed: true },
    ]),
  )
  // @ts-expect-error
  selectorMicroMemoizeOverrideMemoizeOnly.memoizedResultFunc()
  selectorMicroMemoizeOverrideMemoizeOnly.recomputations()
  selectorMicroMemoizeOverrideMemoizeOnly.resetRecomputations()
  // @ts-expect-error
  selectorMicroMemoizeOverrideMemoizeOnly.resultFunc()
  expectExactType<number[]>(
    selectorMicroMemoizeOverrideMemoizeOnly.resultFunc([
      { id: 0, completed: true },
    ]),
  )

  const selectorMicroMemoizePartiallyOverridden =
    // @ts-expect-error Since `argsMemoize` is set to `lruMemoize`, `argsMemoizeOptions` must match the options object parameter of `lruMemoize`
    createSelectorMicroMemoize(
      (state: RootState) => state.todos,
      // @ts-expect-error
      todos => todos.map(t => t.id),
      {
        memoize: lruMemoize,
        argsMemoize: lruMemoize,
        memoizeOptions: {
          equalityCheck:
            // @ts-expect-error
            (a, b) => a === b,
          maxSize: 2,
        },
        argsMemoizeOptions: { isPromise: false }, // This field causes a type error since it does not match the options param of `lruMemoize`.
      },
    )
  const selectorMicroMemoizePartiallyOverridden1 =
    // @ts-expect-error Since `argsMemoize` is set to `lruMemoize`, `argsMemoizeOptions` must match the options object parameter of `lruMemoize`
    createSelectorMicroMemoize(
      (state: RootState) => state.todos,
      // @ts-expect-error
      todos => todos.map(t => t.id),
      {
        memoize: lruMemoize,
        argsMemoize: lruMemoize,
        memoizeOptions: [
          {
            equalityCheck:
              // @ts-expect-error
              (a, b) => a === b,
            maxSize: 2,
          },
        ],
        argsMemoizeOptions: [{ isPromise: false }], // This field causes a type error since it does not match the options param of `lruMemoize`.
      },
    )
  const selectorMicroMemoizePartiallyOverridden2 = createSelectorMicroMemoize(
    (state: RootState) => state.todos,
    todos => todos.map(t => t.id),
    {
      argsMemoizeOptions: [{ isPromise: false }],
    },
  )

  const selectorDefaultParametric = createSelector(
    (state: RootState, id: number) => id,
    (state: RootState) => state.todos,
    (id, todos) => todos.filter(todo => todo.id === id),
    {
      argsMemoize: microMemoize,
      devModeChecks: { inputStabilityCheck: 'never' },
      memoize: memoizeOne,
      argsMemoizeOptions: [],
      memoizeOptions: [(a, b) => a === b],
    },
  )
  expectExactType<
    {
      id: number
      completed: boolean
    }[]
  >(selectorDefaultParametric(state, 0))
  expectExactType<
    {
      id: number
      completed: boolean
    }[]
  >(selectorDefaultParametric(state, 1))
  // @ts-expect-error
  selectorDefaultParametric(state)
  // @ts-expect-error
  selectorDefaultParametric(1)
  // @ts-expect-error
  selectorDefaultParametric(state, '')
  // @ts-expect-error
  selectorDefaultParametric(state, 1, 1)
  // Checking existence of fields related to `argsMemoize`
  // Prior to override, this field did NOT exist.
  selectorDefaultParametric.cache
  // Prior to override, this field did NOT exist.
  selectorDefaultParametric.fn
  // Prior to override, this field did NOT exist.
  selectorDefaultParametric.isMemoized
  // Prior to override, this field did NOT exist.
  selectorDefaultParametric.options
  // @ts-expect-error Prior to override, this field DID exist.
  selectorDefaultParametric.clearCache()

  // Checking existence of fields related to `memoize`
  // @ts-expect-error Prior to override, this field DID exist.
  selectorDefaultParametric.memoizedResultFunc.clearCache()
  // Prior to override, this field did NOT exist.
  selectorDefaultParametric.memoizedResultFunc.clear()

  // Checking existence of fields related to the actual memoized selector
  expectExactType<
    [
      (state: RootState, id: number) => number,
      (state: RootState) => { id: number; completed: boolean }[],
    ]
  >(selectorDefaultParametric.dependencies)
  expectExactType<{ id: number; completed: boolean }[]>(
    selectorDefaultParametric.lastResult(),
  )
  expectExactType<{ id: number; completed: boolean }[]>(
    selectorDefaultParametric.memoizedResultFunc(0, [
      { id: 0, completed: true },
    ]),
  )
  // @ts-expect-error
  selectorDefaultParametric.memoizedResultFunc()
  selectorDefaultParametric.recomputations()
  selectorDefaultParametric.resetRecomputations()
  // @ts-expect-error
  selectorDefaultParametric.resultFunc()
  expectExactType<{ id: number; completed: boolean }[]>(
    selectorDefaultParametric.resultFunc(0, [{ id: 0, completed: true }]),
  )
}

function memoizeAndArgsMemoizeInCreateSelectorCreator() {
  // If we don't pass in `argsMemoize`, the type for `argsMemoizeOptions`
  // falls back to the options parameter of `lruMemoize`.
  const createSelectorArgsMemoizeOptionsFallbackToDefault =
    createSelectorCreator({
      memoize: microMemoize,
      memoizeOptions: [{ isPromise: false }],
      argsMemoizeOptions: { resultEqualityCheck: (a, b) => a === b },
    })
  const selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault =
    createSelectorArgsMemoizeOptionsFallbackToDefault(
      (state: RootState) => state.todos,
      todos => todos.map(({ id }) => id),
    )
  expectExactType<number[]>(
    selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault(state),
  )
  // @ts-expect-error
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault()
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.resultFunc
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.clearCache()
  // @ts-expect-error
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.cache
  // @ts-expect-error
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.fn
  // @ts-expect-error
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.isMemoized
  // @ts-expect-error
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.options
  // Checking existence of fields related to `memoize`
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.memoizedResultFunc
    .cache
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.memoizedResultFunc.fn()
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.memoizedResultFunc
    .isMemoized
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.memoizedResultFunc
    .options
  // @ts-expect-error
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.memoizedResultFunc.clearCache()
  // Checking existence of fields related to the actual memoized selector
  expectExactType<
    [
      (state: RootState) => {
        id: number
        completed: boolean
      }[],
    ]
  >(selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.dependencies)
  expectExactType<number[]>(
    selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.lastResult(),
  )
  expectExactType<number[]>(
    selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.memoizedResultFunc([
      { id: 0, completed: true },
    ]),
  )
  // @ts-expect-error
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.memoizedResultFunc()
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.recomputations()
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.resetRecomputations()
  // @ts-expect-error
  selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.resultFunc()
  expectExactType<number[]>(
    selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.resultFunc([
      { id: 0, completed: true },
    ]),
  )
  expectExactType<typeof microMemoize>(
    selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.memoize,
  )
  expectExactType<typeof weakMapMemoize>(
    selectorMicroMemoizeArgsMemoizeOptionsFallbackToDefault.argsMemoize,
  )

  const createSelectorWithWrongArgsMemoizeOptions =
    // @ts-expect-error If we don't pass in `argsMemoize`, the type for `argsMemoizeOptions` falls back to the options parameter of `weakMapMemoize`.
    createSelectorCreator({
      memoize: microMemoize,
      memoizeOptions: { isEqual: (a, b) => a === b },
      argsMemoizeOptions: {
        isEqual:
          // @ts-expect-error implicit any
          (a, b) => a === b,
      },
    })

  // When passing in an options object as the first argument, there should be no other arguments.
  const createSelectorWrong = createSelectorCreator(
    {
      // @ts-expect-error
      memoize: microMemoize,
      // @ts-expect-error
      memoizeOptions: { isEqual: (a, b) => a === b },
      // @ts-expect-error
      argsMemoizeOptions: { equalityCheck: (a, b) => a === b },
    },
    [], // This causes the error.
  )
}

function deepNesting() {
  type State = { foo: string }
  const readOne = (state: State) => state.foo

  const selector0 = createSelector(readOne, one => one)
  const selector1 = createSelector(selector0, s => s)
  const selector2 = createSelector(selector1, s => s)
  const selector3 = createSelector(selector2, s => s)
  const selector4 = createSelector(selector3, s => s)
  const selector5 = createSelector(selector4, s => s)
  const selector6 = createSelector(selector5, s => s)
  const selector7 = createSelector(selector6, s => s)
  const selector8 = createSelector(selector7, s => s)
  const selector9 = createSelector(selector8, s => s)
  const selector10 = createSelector(selector9, s => s, {
    memoize: microMemoize,
  })
  selector10.dependencies[0].dependencies[0].dependencies[0].dependencies[0]
    .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
    .dependencies[0].dependencies[0].memoizedResultFunc.clearCache
  const selector11 = createSelector(selector10, s => s)
  const selector12 = createSelector(selector11, s => s)
  const selector13 = createSelector(selector12, s => s)
  const selector14 = createSelector(selector13, s => s)
  const selector15 = createSelector(selector14, s => s)
  const selector16 = createSelector(selector15, s => s)
  const selector17 = createSelector(selector16, s => s)
  const selector18 = createSelector(selector17, s => s)
  const selector19 = createSelector(selector18, s => s)
  const selector20 = createSelector(selector19, s => s)
  selector20.dependencies[0].dependencies[0].dependencies[0].dependencies[0]
    .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
    .dependencies[0].dependencies[0].memoizedResultFunc.cache
  const selector21 = createSelector(selector20, s => s)
  const selector22 = createSelector(selector21, s => s)
  const selector23 = createSelector(selector22, s => s)
  const selector24 = createSelector(selector23, s => s)
  const selector25 = createSelector(selector24, s => s)
  const selector26 = createSelector(selector25, s => s)
  const selector27 = createSelector(selector26, s => s)
  const selector28 = createSelector(selector27, s => s)
  const selector29 = createSelector(selector28, s => s)
  const selector30 = createSelector(selector29, s => s)
  selector30.dependencies[0].dependencies[0].dependencies[0].dependencies[0]
    .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
    .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
    .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
    .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
    .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
    .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
    .dependencies[0].dependencies[0].memoizedResultFunc.clearCache
}

function deepNesting1() {
  type State = { foo: string }
  const readOne = (state: State) => state.foo

  const selector0 = createSelector(readOne, one => one)
  const selector1 = createSelector([selector0], s => s)
  const selector2 = createSelector([selector1], s => s)
  const selector3 = createSelector([selector2], s => s)
  const selector4 = createSelector([selector3], s => s)
  const selector5 = createSelector([selector4], s => s)
  const selector6 = createSelector([selector5], s => s)
  const selector7 = createSelector([selector6], s => s)
  const selector8 = createSelector([selector7], s => s)
  const selector9 = createSelector([selector8], s => s)
  const selector10 = createSelector([selector9], s => s)
  const selector11 = createSelector([selector10], s => s)
  const selector12 = createSelector([selector11], s => s)
  const selector13 = createSelector([selector12], s => s)
  const selector14 = createSelector([selector13], s => s)
  const selector15 = createSelector([selector14], s => s)
  const selector16 = createSelector([selector15], s => s)
  const selector17 = createSelector([selector16], s => s)
  const selector18 = createSelector([selector17], s => s)
  const selector19 = createSelector([selector18], s => s)
  const selector20 = createSelector([selector19], s => s)
  const selector21 = createSelector([selector20], s => s)
  const selector22 = createSelector([selector21], s => s)
  const selector23 = createSelector([selector22], s => s)
  const selector24 = createSelector([selector23], s => s)
  const selector25 = createSelector([selector24], s => s)
  const selector26 = createSelector([selector25], s => s)
  const selector27 = createSelector([selector26], s => s)
  const selector28 = createSelector([selector27], s => s)
  const selector29 = createSelector([selector28], s => s)
  const selector30 = createSelector([selector29], s => s)
}

function deepNesting2() {
  type State = { foo: string }
  const readOne = (state: State) => state.foo

  const selector0 = createSelector(readOne, one => one)
  const selector1 = createSelector(selector0, s => s, {
    memoize: lruMemoize,
  })
  const selector2 = createSelector(selector1, s => s, {
    memoize: lruMemoize,
  })
  const selector3 = createSelector(selector2, s => s, {
    memoize: lruMemoize,
  })
  const selector4 = createSelector(selector3, s => s, {
    memoize: lruMemoize,
  })
  const selector5 = createSelector(selector4, s => s, {
    memoize: lruMemoize,
  })
  const selector6 = createSelector(selector5, s => s, {
    memoize: lruMemoize,
  })
  const selector7 = createSelector(selector6, s => s, {
    memoize: lruMemoize,
  })
  const selector8 = createSelector(selector7, s => s, {
    memoize: lruMemoize,
  })
  const selector9 = createSelector(selector8, s => s, {
    memoize: lruMemoize,
  })
  const selector10 = createSelector(selector9, s => s, {
    memoize: lruMemoize,
  })
  const selector11 = createSelector(selector10, s => s, {
    memoize: lruMemoize,
  })
  const selector12 = createSelector(selector11, s => s, {
    memoize: lruMemoize,
  })
  const selector13 = createSelector(selector12, s => s, {
    memoize: lruMemoize,
  })
  const selector14 = createSelector(selector13, s => s, {
    memoize: lruMemoize,
  })
  const selector15 = createSelector(selector14, s => s, {
    memoize: lruMemoize,
  })
  const selector16 = createSelector(selector15, s => s, {
    memoize: lruMemoize,
  })
  const selector17 = createSelector(selector16, s => s, {
    memoize: lruMemoize,
  })
  const selector18 = createSelector(selector17, s => s, {
    memoize: lruMemoize,
  })
  const selector19 = createSelector(selector18, s => s, {
    memoize: lruMemoize,
  })
  const selector20 = createSelector(selector19, s => s, {
    memoize: lruMemoize,
  })
  const selector21 = createSelector(selector20, s => s, {
    memoize: lruMemoize,
  })
  const selector22 = createSelector(selector21, s => s, {
    memoize: lruMemoize,
  })
  const selector23 = createSelector(selector22, s => s, {
    memoize: lruMemoize,
  })
  const selector24 = createSelector(selector23, s => s, {
    memoize: lruMemoize,
  })
  const selector25 = createSelector(selector24, s => s, {
    memoize: lruMemoize,
  })
  const selector26 = createSelector(selector25, s => s, {
    memoize: lruMemoize,
  })
  const selector27 = createSelector(selector26, s => s, {
    memoize: lruMemoize,
  })
  const selector28 = createSelector(selector27, s => s, {
    memoize: lruMemoize,
  })
  const selector29 = createSelector(selector28, s => s, {
    memoize: lruMemoize,
  })
}

function parameterLimit() {
  const selector = createSelector(
    (state: { testString: string }) => state.testString,
    (state: { testNumber: number }) => state.testNumber,
    (state: { testBoolean: boolean }) => state.testBoolean,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testNumber: number }) => state.testNumber,
    (state: { testStringArray: string[] }) => state.testStringArray,
    (state: { testString: string }) => state.testString,
    (state: { testNumber: number }) => state.testNumber,
    (state: { testBoolean: boolean }) => state.testBoolean,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testNumber: number }) => state.testNumber,
    (state: { testStringArray: string[] }) => state.testStringArray,
    (state: { testString: string }) => state.testString,
    (state: { testNumber: number }) => state.testNumber,
    (state: { testBoolean: boolean }) => state.testBoolean,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testNumber: number }) => state.testNumber,
    (state: { testStringArray: string[] }) => state.testStringArray,
    (state: { testString: string }) => state.testString,
    (state: { testNumber: number }) => state.testNumber,
    (state: { testBoolean: boolean }) => state.testBoolean,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testNumber: number }) => state.testNumber,
    (state: { testStringArray: string[] }) => state.testStringArray,
    (
      foo1: string,
      foo2: number,
      foo3: boolean,
      foo4: string,
      foo5: string,
      foo6: string,
      foo7: string,
      foo8: number,
      foo9: string[],
      foo10: string,
      foo11: number,
      foo12: boolean,
      foo13: string,
      foo14: string,
      foo15: string,
      foo16: string,
      foo17: number,
      foo18: string[],
      foo19: string,
      foo20: number,
      foo21: boolean,
      foo22: string,
      foo23: string,
      foo24: string,
      foo25: string,
      foo26: number,
      foo27: string[],
      foo28: string,
      foo29: number,
      foo30: boolean,
      foo31: string,
      foo32: string,
      foo33: string,
      foo34: string,
      foo35: number,
      foo36: string[],
    ) => {
      return {
        foo1,
        foo2,
        foo3,
        foo4,
        foo5,
        foo6,
        foo7,
        foo8,
        foo9,
        foo10,
        foo11,
        foo12,
        foo13,
        foo14,
        foo15,
        foo16,
        foo17,
        foo18,
        foo19,
        foo20,
        foo21,
        foo22,
        foo23,
        foo24,
        foo25,
        foo26,
        foo27,
        foo28,
        foo29,
        foo30,
        foo31,
        foo32,
        foo33,
        foo34,
        foo35,
        foo36,
      }
    },
  )
}
