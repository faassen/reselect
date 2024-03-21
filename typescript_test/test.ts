/* eslint-disable no-use-before-define */

import { configureStore, createSlice } from '@reduxjs/toolkit'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { groupBy, isEqual } from 'lodash'
import memoizeOne from 'memoize-one'
import microMemoize from 'micro-memoize'
import type { TypedUseSelectorHook } from 'react-redux'
import { useSelector } from 'react-redux'
import type {
  GetStateFromSelectors,
  Selector,
  SelectorResultArray,
  TypedStructuredSelectorCreator,
} from 'reselect'
import {
  createSelector,
  createSelectorCreator,
  createStructuredSelector,
  lruMemoize,
  referenceEqualityCheck,
} from 'reselect'
import { expectExactType } from './typesTestUtils'

type Exact<A, B> =
  (<T>() => T extends A ? 1 : 0) extends <T>() => T extends B ? 1 : 0
    ? A extends B
      ? B extends A
        ? unknown
        : never
      : never
    : never

interface StateA {
  a: number
}

interface StateAB {
  a: number
  b: number
}

interface StateSub {
  sub: {
    a: number
  }
}

// Test exporting
export const testExportBasic = createSelector(
  (state: StateA) => state.a,
  a => a,
)

// Test for exporting declaration of created selector creator
export const testExportStructured = createSelectorCreator(
  lruMemoize,
  (a, b) => typeof a === typeof b,
)

function testSelector() {
  type State = { foo: string }

  const selector = createSelector(
    (state: State) => state.foo,
    foo => foo,
  )

  const res = selector.resultFunc('test')
  selector.recomputations()
  selector.resetRecomputations()

  const foo: string = selector({ foo: 'bar' })

  // @ts-expect-error
  selector({ foo: 'bar' }, { prop: 'value' })

  // @ts-expect-error
  const num: number = selector({ foo: 'bar' })

  // allows heterogeneous parameter type input selectors
  createSelector(
    (state: { foo: string }) => state.foo,
    (state: { bar: number }) => state.bar,
    (foo, bar) => 1,
  )

  const selectorWithUnions = createSelector(
    (state: State, val: string | number) => state.foo,
    (state: State, val: string | number) => val,
    (foo, val) => val,
  )
}

function testNestedSelector() {
  type State = { foo: string; bar: number; baz: boolean }

  const selector = createSelector(
    createSelector(
      (state: State) => state.foo,
      (state: State) => state.bar,
      (foo, bar) => ({ foo, bar }),
    ),
    (state: State) => state.baz,
    ({ foo, bar }, baz) => {
      const foo1: string = foo
      // @ts-expect-error
      const foo2: number = foo

      const bar1: number = bar
      // @ts-expect-error
      const bar2: string = bar

      const baz1: boolean = baz
      // @ts-expect-error
      const baz2: string = baz
    },
  )
}

function testSelectorAsCombiner() {
  type SubState = { foo: string }
  type State = { bar: SubState }

  const subSelector = createSelector(
    (state: SubState) => state.foo,
    foo => foo,
  )

  const selector = createSelector((state: State) => state.bar, subSelector)

  // @ts-expect-error
  selector({ foo: '' })

  // @ts-expect-error
  const n: number = selector({ bar: { foo: '' } })

  const s: string = selector({ bar: { foo: '' } })
}

type Component<P> = (props: P) => any

declare function connect<S, P, R>(
  selector: Selector<S, R, [P]>,
): (component: Component<P & R>) => Component<P>

function testConnect() {
  connect(
    createSelector(
      (state: { foo: string }) => state.foo,
      foo => ({ foo }),
    ),
  )(props => {
    // @ts-expect-error
    props.bar

    const foo: string = props.foo
  })

  const selector2 = createSelector(
    (state: { foo: string }) => state.foo,
    (state: { baz: number }, props: { bar: number }) => props.bar,
    (foo, bar) => ({ foo, baz: bar }),
  )

  const connected = connect(selector2)(props => {
    const foo: string = props.foo
    const bar: number = props.bar
    const baz: number = props.baz
    // @ts-expect-error
    props.fizz
  })

  connected({ bar: 42 })

  // @ts-expect-error
  connected({ bar: 42, baz: 123 })
}

function testInvalidTypeInCombinator() {
  // @ts-expect-error
  createSelector(
    (state: { foo: string }) => state.foo,
    (foo: number) => foo,
  )

  createSelector(
    (state: { foo: string; bar: number; baz: boolean }) => state.foo,
    (state: any) => state.bar,
    (state: any) => state.baz,
    // @ts-expect-error
    (foo: string, bar: number, baz: boolean, fizz: string) => {},
  )

  // does not allow heterogeneous parameter type
  // selectors when the combinator function is typed differently
  // @ts-expect-error
  createSelector(
    (state: { testString: string }) => state.testString,
    (state: { testNumber: number }) => state.testNumber,
    (state: { testBoolean: boolean }) => state.testBoolean,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testNumber: string }) => state.testNumber,
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
    ) => {
      return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
    },
  )

  // does not allow a large array of heterogeneous parameter type
  // selectors when the combinator function is typed differently
  // @ts-expect-error
  createSelector(
    [
      (state: { testString: string }) => state.testString,
      (state: { testNumber: number }) => state.testNumber,
      (state: { testBoolean: boolean }) => state.testBoolean,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testNumber: string }) => state.testNumber,
      (state: { testStringArray: string[] }) => state.testStringArray,
    ],
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
    ) => {
      return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
    },
  )
}

function testParametricSelector() {
  type State = { foo: string }
  type Props = { bar: number }

  // allows heterogeneous parameter type selectors
  const selector1 = createSelector(
    (state: { testString: string }) => state.testString,
    (state: { testNumber: number }) => state.testNumber,
    (state: { testBoolean: boolean }) => state.testBoolean,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testString: string }) => state.testString,
    (state: { testStringArray: string[] }) => state.testStringArray,
    (
      foo1: string,
      foo2: number,
      foo3: boolean,
      foo4: string,
      foo5: string,
      foo6: string,
      foo7: string,
      foo8: string,
      foo9: string[],
    ) => {
      return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
    },
  )

  const res1 = selector1({
    testString: 'a',
    testNumber: 42,
    testBoolean: true,
    testStringArray: ['b', 'c'],
  })

  const selector = createSelector(
    (state: State) => state.foo,
    (state: State, props: Props) => props.bar,
    (foo, bar) => ({ foo, bar }),
  )

  // @ts-expect-error
  selector({ foo: 'fizz' })
  // @ts-expect-error
  selector({ foo: 'fizz' }, { bar: 'baz' })

  const ret = selector({ foo: 'fizz' }, { bar: 42 })
  const foo: string = ret.foo
  const bar: number = ret.bar

  const selector2 = createSelector(
    (state: State) => state.foo,
    (state: State) => state.foo,
    (state: State) => state.foo,
    (state: State) => state.foo,
    (state: State) => state.foo,
    (state: State, props: Props) => props.bar,
    (foo1, foo2, foo3, foo4, foo5, bar) => ({
      foo1,
      foo2,
      foo3,
      foo4,
      foo5,
      bar,
    }),
  )

  selector2({ foo: 'fizz' }, { bar: 42 })

  const selector3 = createSelector(
    (s: State) => s.foo,
    (s: State, x: string) => x,
    (s: State, y: number) => y,
    (v, x) => {
      return x + v
    },
  )

  // @ts-expect-error
  selector3({ foo: 'fizz' }, 42)

  const selector4 = createSelector(
    (s: State, val: number) => s.foo,
    (s: State, val: string | number) => val,
    (foo, val) => {
      return val
    },
  )

  selector4({ foo: 'fizz' }, 42)
}

function testArrayArgument() {
  const selector = createSelector(
    [
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }, props: { bar: number }) => props.bar,
    ],
    (foo1, foo2, bar) => ({ foo1, foo2, bar }),
  )

  const ret = selector({ foo: 'fizz' }, { bar: 42 })
  const foo1: string = ret.foo1
  const foo2: string = ret.foo2
  const bar: number = ret.bar

  // @ts-expect-error
  createSelector([(state: { foo: string }) => state.foo])

  // @ts-expect-error
  createSelector(
    [
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
    ],
    (foo: string, bar: number) => {},
  )

  createSelector(
    [
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
    ],
    (
      foo1: string,
      foo2: string,
      foo3: string,
      foo4: string,
      foo5: string,
      foo6: string,
      foo7: string,
      foo8: string,
      foo9: string,
      foo10: string,
    ) => {},
  )

  // @ts-expect-error
  createSelector(
    [
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
    ],
    (foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8: number, foo9, foo10) => {},
  )

  // @ts-expect-error
  createSelector(
    [
      (state: { foo: string }) => state.foo,
      // @ts-expect-error
      state => state.foo,
      // @ts-expect-error
      state => state.foo,
      // @ts-expect-error
      state => state.foo,
      // @ts-expect-error
      state => state.foo,
      // @ts-expect-error
      state => state.foo,
      // @ts-expect-error
      state => state.foo,
      // @ts-expect-error
      state => state.foo,
      1,
    ],
    // We expect an error here, but the error differs between TS versions
    // @ts-ignore
    (foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9) => {},
  )

  const selector2 = createSelector(
    [
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
    ],
    (
      foo1: string,
      foo2: string,
      foo3: string,
      foo4: string,
      foo5: string,
      foo6: string,
      foo7: string,
      foo8: string,
      foo9: string,
    ) => {
      return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
    },
  )

  {
    const ret = selector2({ foo: 'fizz' })
    const foo1: string = ret.foo1
    const foo2: string = ret.foo2
    const foo3: string = ret.foo3
    const foo4: string = ret.foo4
    const foo5: string = ret.foo5
    const foo6: string = ret.foo6
    const foo7: string = ret.foo7
    const foo8: string = ret.foo8
    const foo9: string = ret.foo9
    // @ts-expect-error
    ret.foo10
  }

  // @ts-expect-error
  selector2({ foo: 'fizz' }, { bar: 42 })

  const parametric = createSelector(
    [
      (state: { foo: string }, props: { bar: number }) => props.bar,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
      (state: { foo: string }) => state.foo,
    ],
    (
      bar: number,
      foo1: string,
      foo2: string,
      foo3: string,
      foo4: string,
      foo5: string,
      foo6: string,
      foo7: string,
      foo8: string,
    ) => {
      return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, bar }
    },
  )

  // allows a large array of heterogeneous parameter type selectors
  const correctlyTypedArraySelector = createSelector(
    [
      (state: { testString: string }) => state.testString,
      (state: { testNumber: number }) => state.testNumber,
      (state: { testBoolean: boolean }) => state.testBoolean,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testStringArray: string[] }) => state.testStringArray,
    ],
    (
      foo1: string,
      foo2: number,
      foo3: boolean,
      foo4: string,
      foo5: string,
      foo6: string,
      foo7: string,
      foo8: string,
      foo9: string[],
    ) => {
      return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
    },
  )

  // @ts-expect-error
  parametric({ foo: 'fizz' })

  {
    const ret = parametric({ foo: 'fizz' }, { bar: 42 })
    const foo1: string = ret.foo1
    const foo2: string = ret.foo2
    const foo3: string = ret.foo3
    const foo4: string = ret.foo4
    const foo5: string = ret.foo5
    const foo6: string = ret.foo6
    const foo7: string = ret.foo7
    const foo8: string = ret.foo8
    const bar: number = ret.bar
    // @ts-expect-error
    ret.foo9
  }
}

function testOptionalArgumentsConflicting() {
  type State = { foo: string; bar: number; baz: boolean }

  const selector = createSelector(
    (state: State) => state.baz,
    (state: State, arg: string) => arg,
    (state: State, arg: number) => arg,
    baz => {
      const baz1: boolean = baz
      // @ts-expect-error
      const baz2: number = baz
    },
  )

  // @ts-expect-error the selector above has inconsistent conflicting arguments so usage should error
  selector({} as State)
  // @ts-expect-error
  selector({} as State, 'string')
  // @ts-expect-error
  selector({} as State, 1)

  const selector2 = createSelector(
    (state: State, prefix: any) => prefix + state.foo,
    str => str,
  )

  // @ts-expect-error here we require one argument which can be anything so error if there are no arguments
  selector2({} as State)
  // no error passing anything in
  selector2({} as State, 'blach')
  selector2({} as State, 1)

  // here the argument is optional so it should be possible to omit the argument or pass anything
  const selector3 = createSelector(
    (state: State, prefix?: any) => prefix + state.foo,
    str => str,
  )

  selector3({} as State)
  selector3({} as State, 1)
  selector3({} as State, 'blach')

  // https://github.com/reduxjs/reselect/issues/563
  const selector4 = createSelector(
    (state: State, prefix: string, suffix: any) =>
      prefix + state.foo + String(suffix),
    str => str,
  )

  // @ts-expect-error
  selector4({} as State)
  // @ts-expect-error
  selector4({} as State, 'blach')
  selector4({} as State, 'blach', 4)

  // as above but a unknown 2nd argument
  const selector5 = createSelector(
    (state: State, prefix: string, suffix: unknown) =>
      prefix + state.foo + String(suffix),
    str => str,
  )

  // @ts-expect-error
  selector5({} as State)
  // @ts-expect-error
  selector5({} as State, 'blach')
  selector5({} as State, 'blach', 4)

  // This next section is now obsolete with the changes in TS 4.9
  // // @ts-expect-error It would be great to delete this, it is not correct.
  // // Due to what must be a TS bug? if the default parameter is used, we lose the type for prefix
  // // and it is impossible to type the selector without typing prefix
  // const selector6 = createSelector(
  //   (state: State, prefix = '') => prefix + state.foo,
  //   (str: string) => str
  // )

  // // because the suppressed error above, selector6 has broken typings and doesn't allow a passed parameter
  // selector6({} as State)
  // // @ts-expect-error would be great if we can delete this, it should not error
  // selector6({} as State, 'blach')
  // // @ts-expect-error wrong type
  // selector6({} as State, 1)

  // this is an example fixing selector6. We have to add a un-necessary typing in and magically the types are correct
  const selector7 = createSelector(
    (
      state: State,
      // eslint-disable-next-line @typescript-eslint/no-inferrable-types
      prefix: string = 'a',
    ) => prefix + state.foo,
    (str: string) => str,
  )

  selector7({} as State)
  selector7({} as State, 'blach')
  // @ts-expect-error wrong type
  selector7({} as State, 1)

  const selector8 = createSelector(
    (state: State, prefix: unknown) => prefix,
    str => str,
  )

  // @ts-expect-error needs a argument
  selector8({} as State)
  // allowed to pass anything as the type is unknown
  selector8({} as State, 'blach')
  selector8({} as State, 2)
}

function testLruMemoize() {
  const func = (a: string) => +a

  const memoized = lruMemoize(func)

  const ret0: number = memoized('42')
  // @ts-expect-error
  const ret1: string = memoized('42')

  const memoized2 = lruMemoize(
    (str: string, arr: string[]): { str: string; arr: string[] } => ({
      str,
      arr,
    }),
    <T>(a: T, b: T) => {
      return `${a}` === `${b}`
    },
  )

  const ret2 = memoized2('', ['1', '2'])
  const str: string = ret2.str
  const arr: string[] = ret2.arr
}

function testCreateSelectorCreator() {
  const defaultCreateSelector = createSelectorCreator(lruMemoize)

  const selector = defaultCreateSelector(
    (state: { foo: string }) => state.foo,
    foo => foo,
  )
  const value: string = selector({ foo: 'fizz' })

  // @ts-expect-error
  selector({ foo: 'fizz' }, { bar: 42 })

  // clearCache should exist because of lruMemoize
  selector.clearCache()

  const parametric = defaultCreateSelector(
    (state: { foo: string }) => state.foo,
    (state: { foo: string }, props: { bar: number }) => props.bar,
    (foo, bar) => ({ foo, bar }),
  )

  // @ts-expect-error
  parametric({ foo: 'fizz' })

  const ret = parametric({ foo: 'fizz' }, { bar: 42 })
  const foo: string = ret.foo
  const bar: number = ret.bar

  // @ts-expect-error
  createSelectorCreator(lruMemoize, 1)

  createSelectorCreator(lruMemoize, <T>(a: T, b: T) => {
    return `${a}` === `${b}`
  })
}

function testCreateStructuredSelector() {
  const oneParamSelector = createStructuredSelector({
    foo: (state: StateAB) => state.a,
    bar: (state: StateAB) => state.b,
  })

  const threeParamSelector = createStructuredSelector({
    foo: (state: StateAB, c: number, d: string) => state.a,
    bar: (state: StateAB, c: number, d: string) => state.b,
  })

  interface RootState {
    foo: string
    bar: number
  }

  const typedStructuredSelectorCreator =
    createStructuredSelector.withTypes<RootState>()

  const selector = typedStructuredSelectorCreator({
    foo: state => state.foo,
    bar: state => +state.foo,
  })

  const res1 = selector({ foo: '42', bar: 1 })
  const foo: string = res1.foo
  const bar: number = res1.bar

  // @ts-expect-error
  selector({ bar: '42' })

  // @ts-expect-error
  selector({ foo: '42' }, { bar: 42 })

  typedStructuredSelectorCreator({
    // @ts-expect-error
    bar: (state: { baz: boolean }) => 1,
  })

  typedStructuredSelectorCreator({
    bar: state => state.foo,
  })

  typedStructuredSelectorCreator({
    baz: state => state.foo,
  })

  // Test automatic inference of types for createStructuredSelector via overload
  type State = { foo: string }
  const FooSelector = (state: State, a: number, b: string) => state.foo
  const BarSelector = (state: State, a: number, b: string) => +state.foo

  const selector2 = createStructuredSelector({
    foo: FooSelector,
    bar: BarSelector,
  })

  const selectorGenerics = createStructuredSelector<{
    foo: typeof FooSelector
    bar: typeof BarSelector
  }>({
    foo: state => state.foo,
    bar: state => +state.foo,
  })

  type ExpectedResult = {
    foo: string
    bar: number
  }

  const resOneParam = oneParamSelector({ a: 1, b: 2 })
  const resThreeParams = threeParamSelector({ a: 1, b: 2 }, 99, 'blah')
  const res2: ExpectedResult = selector({ foo: '42', bar: 0 })
  const res3: ExpectedResult = selector2({ foo: '42' }, 99, 'test')
  const resGenerics: ExpectedResult = selectorGenerics(
    { foo: '42' },
    99,
    'test',
  )

  //@ts-expect-error
  selector2({ bar: '42' })
  // @ts-expect-error
  selectorGenerics({ bar: '42' })
}

// TODO: Remove this function once `TypedStructuredSelectorCreator` is removed.
function testTypedCreateStructuredSelector() {
  type RootState = {
    foo: string
    bar: number
  }

  const selectFoo = (state: RootState) => state.foo
  const selectBar = (state: RootState) => state.bar

  const typedStructuredSelectorCreator: TypedStructuredSelectorCreator<RootState> =
    createStructuredSelector

  typedStructuredSelectorCreator({
    foo: selectFoo,
    bar: selectBar,
  })

  // @ts-expect-error Because `bar` is missing.
  typedStructuredSelectorCreator({
    foo: selectFoo,
  })

  // This works
  const selectorGenerics = createStructuredSelector<{
    foo: typeof selectFoo
    bar: typeof selectBar
  }>({
    foo: state => state.foo,
    bar: state => +state.foo,
  })

  // This also works
  const selectorGenerics1 = typedStructuredSelectorCreator<{
    foo: typeof selectFoo
    bar: typeof selectBar
  }>({
    foo: state => state.foo,
    bar: state => +state.foo,
  })

  // Their types are the same.
  expectExactType<typeof selectorGenerics1>(selectorGenerics)
}

function testDynamicArrayArgument() {
  interface Elem {
    val1: string
    val2: string
  }
  const data: ReadonlyArray<Elem> = [
    { val1: 'a', val2: 'aa' },
    { val1: 'b', val2: 'bb' },
  ]

  createSelector(
    data.map(obj => () => obj.val1),
    (...vals) => vals.join(','),
  )

  createSelector(
    data.map(obj => () => obj.val1),
    // @ts-expect-error
    vals => vals.join(','),
  )

  createSelector(
    data.map(obj => () => obj.val1),
    (...vals: string[]) => 0,
  )
  // @ts-expect-error
  createSelector(
    data.map(obj => () => obj.val1),
    (...vals: number[]) => 0,
  )

  const s = createSelector(
    data.map(obj => (state: StateA, fld: keyof Elem) => obj[fld]),
    (...vals) => vals.join(','),
  )
  s({ a: 42 }, 'val1')
  s({ a: 42 }, 'val2')
  // @ts-expect-error
  s({ a: 42 }, 'val3')
}

function testStructuredSelectorTypeParams() {
  type GlobalState = {
    foo: string
    bar: number
  }

  const selectFoo = (state: GlobalState) => state.foo
  const selectBar = (state: GlobalState) => state.bar

  // Output state should be the same as input, if not provided
  // @ts-expect-error
  createStructuredSelector<GlobalState>({
    foo: selectFoo,
    // bar: selectBar,
    // ^^^ because this is missing, an error is thrown
  })
}

function multiArgMemoize<F extends (...args: any[]) => any>(
  func: F,
  a: number,
  b: string,
  equalityCheck = referenceEqualityCheck,
): F {
  // @ts-ignore
  return () => {}
}

// #384: check for lruMemoize

{
  interface Transaction {
    transactionId: string
  }

  const toId = (transaction: Transaction) => transaction.transactionId
  const transactionsIds = (transactions: Transaction[]) =>
    transactions.map(toId)
  const collectionsEqual = (ts1: Transaction[], ts2: Transaction[]) =>
    isEqual(transactionsIds(ts1), transactionsIds(ts2))

  const createTransactionsSelector = createSelectorCreator(
    lruMemoize,
    collectionsEqual,
  )

  const createMultiMemoizeArgSelector = createSelectorCreator(
    multiArgMemoize,
    42,
    'abcd',
    referenceEqualityCheck,
  )

  const select = createMultiMemoizeArgSelector(
    (state: { foo: string }) => state.foo,
    foo => foo + '!',
  )
  // error is not applicable anymore
  select.clearCache()

  const createMultiMemoizeArgSelector2 = createSelectorCreator(
    multiArgMemoize,
    42,
    // @ts-expect-error
    referenceEqualityCheck,
  )

  const groupTransactionsByLabel = lruMemoize(
    (transactions: Transaction[]) =>
      groupBy(transactions, item => item.transactionId),
    collectionsEqual,
  )
}

// #445
function issue445() {
  interface TestState {
    someNumber: number | null
    someString: string | null
  }

  interface Object1 {
    str: string
  }
  interface Object2 {
    num: number
  }

  const getNumber = (state: TestState) => state.someNumber
  const getString = (state: TestState) => state.someString

  function generateObject1(str: string): Object1 {
    return {
      str,
    }
  }
  function generateObject2(num: number): Object2 {
    return {
      num,
    }
  }
  function generateComplexObject(
    num: number,
    subObject: Object1,
    subObject2: Object2,
  ): boolean {
    return true
  }

  // ################ Tests ################

  // Compact selector examples

  // Should error because generateObject1 can't take null
  // @ts-expect-error
  const getObject1 = createSelector([getString], generateObject1)

  // Should error because generateObject2 can't take null
  // @ts-expect-error
  const getObject2 = createSelector([getNumber], generateObject2)

  // Should error because mismatch of params
  // @ts-expect-error
  const getComplexObjectTest1 = createSelector(
    [getObject1],
    generateComplexObject,
  )

  // Does error, but error is really weird and talks about "Object1 is not assignable to type number"
  // @ts-expect-error
  const getComplexObjectTest2 = createSelector(
    [getNumber, getObject1],
    generateComplexObject,
  )

  // Should error because number can't be null
  // @ts-expect-error
  const getComplexObjectTest3 = createSelector(
    [getNumber, getObject1, getObject2],
    generateComplexObject,
  )

  // Does error, but error is really weird and talks about "Object1 is not assignable to type number"
  // @ts-expect-error
  const getComplexObjectTest4 = createSelector(
    [getObject1, getNumber, getObject2],
    generateComplexObject,
  )

  // Verbose selector examples

  // Errors correctly, says str can't be null
  const getVerboseObject1 = createSelector([getString], str =>
    // @ts-expect-error
    generateObject1(str),
  )

  // Errors correctly, says num can't be null
  const getVerboseObject2 = createSelector([getNumber], num =>
    // @ts-expect-error
    generateObject2(num),
  )

  // Errors correctly
  const getVerboseComplexObjectTest1 = createSelector([getObject1], obj1 =>
    // @ts-expect-error
    generateComplexObject(obj1),
  )

  // Errors correctly
  const getVerboseComplexObjectTest2 = createSelector(
    [getNumber, getObject1],
    // @ts-expect-error
    (num, obj1) => generateComplexObject(num, obj1),
  )

  // Errors correctly
  const getVerboseComplexObjectTest3 = createSelector(
    [getNumber, getObject1, getObject2],
    // @ts-expect-error
    (num, obj1, obj2) => generateComplexObject(num, obj1, obj2),
  )

  // Errors correctly
  const getVerboseComplexObjectTest4 = createSelector(
    [getObject1, getNumber, getObject2],
    // @ts-expect-error
    (num, obj1, obj2) => generateComplexObject(num, obj1, obj2),
  )
}

// #492
function issue492() {
  const fooPropSelector = (_: {}, ownProps: { foo: string }) => ownProps.foo
  const fooBarPropsSelector = (
    _: {},
    ownProps: { foo: string; bar: string },
  ) => [ownProps.foo, ownProps.bar]

  const combinedSelector = createSelector(
    fooPropSelector,
    fooBarPropsSelector,
    (foo, fooBar) => fooBar,
  )
}

function customMemoizationOptionTypes() {
  const customMemoize = (
    f: (...args: any[]) => any,
    a: string,
    b: number,
    c: boolean,
  ) => {
    return f
  }

  const customSelectorCreatorCustomMemoizeWorking = createSelectorCreator(
    customMemoize,
    'a',
    42,
    true,
  )

  // @ts-expect-error
  const customSelectorCreatorCustomMemoizeMissingArg = createSelectorCreator(
    customMemoize,
    'a',
    true,
  )
}

// createSelector config options
function createSelectorConfigOptions() {
  const lruMemoizeAcceptsFirstArgDirectly = createSelector(
    (state: StateAB) => state.a,
    (state: StateAB) => state.b,
    (a, b) => a + b,
    {
      memoize: lruMemoize,
      memoizeOptions: (a, b) => a === b,
    },
  )

  const lruMemoizeAcceptsFirstArgAsObject = createSelector(
    (state: StateAB) => state.a,
    (state: StateAB) => state.b,
    (a, b) => a + b,
    {
      memoize: lruMemoize,
      memoizeOptions: {
        equalityCheck: (a, b) => a === b,
      },
    },
  )

  const lruMemoizeAcceptsArgsAsArray = createSelector(
    (state: StateAB) => state.a,
    (state: StateAB) => state.b,
    (a, b) => a + b,
    {
      memoize: lruMemoize,
      memoizeOptions: [(a, b) => a === b],
    },
  )

  const customSelectorCreatorMicroMemoize = createSelectorCreator(
    microMemoize,
    {
      maxSize: 42,
    },
  )

  customSelectorCreatorMicroMemoize(
    (state: StateAB) => state.a,
    (state: StateAB) => state.b,
    (a, b) => a + b,
    {
      memoizeOptions: [
        {
          maxSize: 42,
        },
      ],
    },
  )

  const customSelectorCreatorMemoizeOne = createSelectorCreator(memoizeOne)

  customSelectorCreatorMemoizeOne(
    (state: StateAB) => state.a,
    (state: StateAB) => state.b,
    (a, b) => a + b,
    {
      memoizeOptions: (a, b) => a === b,
    },
  )
}

// Verify more than 12 selectors are accepted
// Issue #525
const withLotsOfInputSelectors = createSelector(
  (_state: StateA) => 1,
  (_state: StateA) => 2,
  (_state: StateA) => 3,
  (_state: StateA) => 4,
  (_state: StateA) => 5,
  (_state: StateA) => 6,
  (_state: StateA) => 7,
  (_state: StateA) => 8,
  (_state: StateA) => 9,
  (_state: StateA) => 10,
  (_state: StateA) => 11,
  (_state: StateA) => 12,
  (_state: StateA) => 13,
  (_state: StateA) => 14,
  (_state: StateA) => 15,
  (_state: StateA) => 16,
  (_state: StateA) => 17,
  (_state: StateA) => 18,
  (_state: StateA) => 19,
  (_state: StateA) => 20,
  (_state: StateA) => 21,
  (_state: StateA) => 22,
  (_state: StateA) => 23,
  (_state: StateA) => 24,
  (_state: StateA) => 25,
  (_state: StateA) => 26,
  (_state: StateA) => 27,
  (_state: StateA) => 28,
  (...args) => args.length,
)

type SelectorArray29 = [
  (_state: StateA) => 1,
  (_state: StateA) => 2,
  (_state: StateA) => 3,
  (_state: StateA) => 4,
  (_state: StateA) => 5,
  (_state: StateA) => 6,
  (_state: StateA) => 7,
  (_state: StateA) => 8,
  (_state: StateA) => 9,
  (_state: StateA) => 10,
  (_state: StateA) => 11,
  (_state: StateA) => 12,
  (_state: StateA) => 13,
  (_state: StateA) => 14,
  (_state: StateA) => 15,
  (_state: StateA) => 16,
  (_state: StateA) => 17,
  (_state: StateA) => 18,
  (_state: StateA) => 19,
  (_state: StateA) => 20,
  (_state: StateA) => 21,
  (_state: StateA) => 22,
  (_state: StateA) => 23,
  (_state: StateA) => 24,
  (_state: StateA) => 25,
  (_state: StateA) => 26,
  (_state: StateA) => 27,
  (_state: StateA) => 28,
  (_state: StateA) => 29,
]

type Results = SelectorResultArray<SelectorArray29>
type State = GetStateFromSelectors<SelectorArray29>

// Ensure that input functions with mismatched states raise errors
{
  const input1 = (state: string) => 1
  const input2 = (state: number) => 2

  const selector = createSelector(input1, input2, (...args) => 0)
  // @ts-expect-error
  selector('foo')
  // @ts-expect-error
  selector(5)
}
{
  const selector = createSelector(
    (state: { foo: string }) => 1,
    (state: { bar: string }) => 2,
    (...args) => 0,
  )
  selector({ foo: '', bar: '' })
  // @ts-expect-error
  selector({ foo: '' })
  // @ts-expect-error
  selector({ bar: '' })
}

{
  const selector = createSelector(
    (state: { foo: string }) => 1,
    (state: { foo: string }) => 2,
    (...args) => 0,
  )
  // @ts-expect-error
  selector({ foo: '', bar: '' })
  selector({ foo: '' })
  // @ts-expect-error
  selector({ bar: '' })
}

// Issue #526
function testInputSelectorWithUndefinedReturn() {
  type Input = { field: number | undefined }
  type Output = string
  type SelectorType = (input: Input) => Output

  const input = ({ field }: Input) => field
  const result = (out: number | undefined): Output => 'test'

  // Make sure the selector type is honored
  const selector: SelectorType = createSelector(
    ({ field }: Input) => field,
    args => 'test',
  )

  // even when memoizeOptions are passed
  const selector2: SelectorType = createSelector(
    ({ field }: Input) => field,
    args => 'test',
    {
      memoize: lruMemoize,
      memoizeOptions: { maxSize: 42 },
    },
  )

  // Make sure inference of functions works...
  const selector3: SelectorType = createSelector(input, result)
  const selector4: SelectorType = createSelector(input, result, {
    memoize: lruMemoize,
    memoizeOptions: { maxSize: 42 },
  })
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
  const selector10 = createSelector(selector9, s => s)
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
  const selector21 = createSelector(selector20, s => s)
  const selector22 = createSelector(selector21, s => s)
  const selector23 = createSelector(selector22, s => s)
  const selector24 = createSelector(selector23, s => s)
  const selector25 = createSelector(selector24, s => s)
  const selector26 = createSelector(selector25, s => s)
  const selector27 = createSelector(selector26, s => s)
  const selector28 = createSelector(selector27, s => s)
  const selector29 = createSelector(selector28, s => s)
}

function issue540() {
  const input1 = (
    _: StateA,
    { testNumber }: { testNumber: number },
    c: number,
    d: string,
  ) => testNumber

  const input2 = (
    _: StateA,
    { testString }: { testString: string },
    c: number | string,
  ) => testString

  const input3 = (
    _: StateA,
    { testBoolean }: { testBoolean: boolean },
    c: number | string,
    d: string,
  ) => testBoolean

  const input4 = (_: StateA, { testString2 }: { testString2: string }) =>
    testString2

  const testSelector = createSelector(
    input1,
    input2,
    input3,
    input4,
    (testNumber, testString, testBoolean) => testNumber + testString,
  )

  const state: StateA = { a: 42 }
  const test = testSelector(
    state,
    { testNumber: 1, testString: '10', testBoolean: true, testString2: 'blah' },
    42,
    'blah',
  )

  // #541
  const selectProp1 = createSelector(
    [
      (state: StateA) => state,
      (state: StateA, props: { prop1: number }) => props,
    ],
    (state, { prop1 }) => [state, prop1],
  )

  const selectProp2 = createSelector(
    [selectProp1, (state, props: { prop2: number }) => props],
    (state, { prop2 }) => [state, prop2],
  )

  selectProp1({ a: 42 }, { prop1: 1 })
  // @ts-expect-error
  selectProp2({ a: 42 }, { prop2: 2 })
}

function issue548() {
  interface State {
    value: Record<string, any> | null
    loading: boolean
  }

  interface Props {
    currency: string
  }

  const isLoading = createSelector(
    (state: State) => state,
    (_: State, props: Props) => props.currency,
    ({ loading }, currency) => loading,
  )

  const mapData = createStructuredSelector({
    isLoading,
    test2: (state: State) => 42,
  })

  const result = mapData({ value: null, loading: false }, { currency: 'EUR' })
}

function issue550() {
  const some = createSelector(
    (a: number) => a,
    (_a: number, b: number) => b,
    (a, b) => a + b,
  )

  const test = some(1, 2)
}

function rtkIssue1750() {
  const slice = createSlice({
    name: 'test',
    initialState: 0,
    reducers: {},
  })

  interface Pokemon {
    name: string
  }

  // Define a service using a base URL and expected endpoints
  const pokemonApi = createApi({
    reducerPath: 'pokemonApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
    endpoints: builder => ({
      getPokemonByName: builder.query<Pokemon, string>({
        query: name => `pokemon/${name}`,
      }),
    }),
  })

  const store = configureStore({
    reducer: {
      test: slice.reducer,
      [pokemonApi.reducerPath]: pokemonApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(pokemonApi.middleware),
  })

  type RootState = ReturnType<typeof store.getState>

  const selectTest = createSelector(
    (state: RootState) => state.test,
    test => test,
  )

  const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

  // Selector usage should compile correctly
  const testItem = selectTest(store.getState())

  function App() {
    const test = useAppSelector(selectTest)
    return null
  }
}

function handleNestedIncompatTypes() {
  // Incompatible parameters should force errors even for nested fields.
  // One-level-deep fields get stripped to empty objects, so they
  // should be replaced with `never`.
  // Deeper fields should get caught by TS.
  // Playground: https://tsplay.dev/wg6X0W
  const input1a = (_: StateA, param: { b: number }) => param.b

  const input1b = (_: StateA, param: { b: string }) => param.b

  const testSelector1 = createSelector(input1a, input1b, () => ({}))

  // @ts-expect-error
  testSelector1({ a: 42 }, { b: 99 }) // should not compile

  const input2a = (_: StateA, param: { b: { c: number } }) => param.b.c
  const input2b = (_: StateA, param: { b: { c: string } }) => param.b.c

  const testSelector2 = createSelector(input2a, input2b, (c1, c2) => {})

  // @ts-expect-error
  testSelector2({ a: 42 }, { b: { c: 99 } })
}

function issue554a() {
  interface State {
    foo: string
    bar: number
  }

  const initialState: State = {
    foo: 'This is Foo',
    bar: 1,
  }

  const getFoo = (state: State) => {
    return state.foo
  }
  getFoo(initialState)

  const getBar = (state: State) => {
    return state.bar
  }
  getBar(initialState)

  const simple = createSelector(getFoo, getBar, (foo, bar) => {
    return `${foo} => ${bar}`
  })
  simple(initialState)

  // Input selectors with positional args
  const firstInput = (_: State, first: string) => first
  // Skip the first arg and return only the second.
  const secondInput = (_: State, _first: string, second: number) => second

  const complexOne = createSelector(
    getFoo,
    getBar,
    firstInput,
    (foo, bar, first) => {
      return `${foo} => ${bar} || ${first}`
    },
  )
  complexOne(initialState, 'first')

  const complexTwo = createSelector(
    getFoo,
    getBar,
    firstInput,
    secondInput,
    (foo, bar, first, second) => {
      return `${foo} => ${bar} || ${first} and ${second}`
    },
  )
  // TS should complain since 'second' should be `number`
  // @ts-expect-error
  complexTwo(initialState, 'first', 'second')
}

function issue554b() {
  interface State {
    counter1: number
    counter2: number
  }

  const selectTest = createSelector(
    (state: State, numberA?: number) => numberA,
    (state: State) => state.counter2,
    (numberA, counter2) => (numberA ? numberA + counter2 : counter2),
  )

  type selectTestParams = Parameters<typeof selectTest>
  const p1: selectTestParams = [{ counter1: 1, counter2: 2 }, 42]
  expectExactType<[State, number?]>(p1)

  const result = selectTest({ counter1: 1, counter2: 2 }, 42)
}

function issue554c() {
  interface State {
    counter1: number
    counter2: number
  }

  const selectTest = createSelector(
    (state: State, numberA?: number) => numberA, // `numberA` is optional
    (state: State) => state.counter2,
    (numberA, counter2) => (numberA ? numberA + counter2 : counter2),
  )

  // @ts-expect-error
  const value = selectTest({ counter1: 0, counter2: 0 }, 'what?')

  const selectTest2 = createSelector(
    (state: State, numberA: number) => numberA, // `numberA` is not optional anymore
    (state: State) => state.counter2,
    (numberA, counter2) => (numberA ? numberA + counter2 : counter2),
  )

  // @ts-expect-error
  const value2 = selectTest2({ counter1: 0, counter2: 0 }, 'what?')
}

function issue555() {
  type IReduxState = {
    ui: {
      x: string
      y: string
    }
  }

  const someSelector1 = createSelector(
    (state: IReduxState, param: 'x' | 'y' | undefined) =>
      param !== undefined ? state.ui[param] : null,
    (a: string | null) => a,
  )

  const someSelector2 = createSelector(
    (state: IReduxState, param?: 'x' | 'y') =>
      param !== undefined ? state.ui[param] : null,
    (a: string | null) => a,
  )

  const someSelector3 = createSelector(
    (state: IReduxState, param: 'x' | 'y' | null) =>
      param !== null ? state.ui[param] : null,
    (a: string | null) => a,
  )

  const state = { ui: { x: '1', y: '2' } }

  const selectorResult1 = someSelector1(state, undefined)
  const selectorResult2 = someSelector2(state, undefined)
  const selectorResult3 = someSelector3(state, null)
}

function testCreateStructuredSelectorNew() {
  interface State {
    todos: {
      id: number
      completed: boolean
    }[]
  }
  const state: State = {
    todos: [
      { id: 0, completed: false },
      { id: 1, completed: false },
    ],
  }

  const selectorDefaultParametric = createSelector(
    (state: State, id: number) => id,
    (state: State) => state.todos,
    (id, todos) => todos.filter(todo => todo.id === id),
  )
  const multiArgsStructuredSelector = createStructuredSelector(
    {
      selectedTodos: (state: State) => state.todos,
      selectedTodoById: (state: State, id: number) => state.todos[id],
      selectedCompletedTodos: (
        state: State,
        id: number,
        isCompleted: boolean,
      ) => state.todos.filter(({ completed }) => completed === isCompleted),
    },
    createSelectorCreator({ memoize: microMemoize, argsMemoize: microMemoize }),
  )

  multiArgsStructuredSelector.resultFunc(
    [{ id: 2, completed: true }],
    { id: 0, completed: false },
    [{ id: 0, completed: false }],
  ).selectedCompletedTodos

  multiArgsStructuredSelector.memoizedResultFunc(
    [{ id: 2, completed: true }],
    { id: 0, completed: false },
    [{ id: 0, completed: false }],
  ).selectedCompletedTodos

  multiArgsStructuredSelector.memoizedResultFunc.cache
  multiArgsStructuredSelector.memoizedResultFunc.fn
  multiArgsStructuredSelector.memoizedResultFunc.isMemoized
  multiArgsStructuredSelector.memoizedResultFunc.options

  multiArgsStructuredSelector(state, 2, true).selectedCompletedTodos
  expectExactType<typeof microMemoize>(multiArgsStructuredSelector.argsMemoize)
  expectExactType<typeof microMemoize>(multiArgsStructuredSelector.memoize)
  expectExactType<
    [
      (state: State) => State['todos'],
      (state: State, id: number) => State['todos'][number],
      (state: State, id: number, isCompleted: boolean) => State['todos'],
    ]
  >(multiArgsStructuredSelector.dependencies)
  // @ts-expect-error Wrong number of arguments.
  multiArgsStructuredSelector(state, 2)
}
