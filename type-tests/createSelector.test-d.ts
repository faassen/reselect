import { configureStore, createSlice } from '@reduxjs/toolkit'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import memoizeOne from 'memoize-one'
import microMemoize from 'micro-memoize'
import type { TypedUseSelectorHook } from 'react-redux'
import { useSelector } from 'react-redux'
import type { Selector } from 'reselect'
import { createSelector, createSelectorCreator, lruMemoize } from 'reselect'
import type { StateA, StateAB } from '../test/testTypes'

// Test exporting
export const testExportBasic = createSelector(
  (state: StateA) => state.a,
  a => a
)

type Component<P> = (props: P) => any

declare function connect<S, P, R>(
  selector: Selector<S, R, [P]>
): (component: Component<P & R>) => Component<P>

describe('type tests', () => {
  test('selector', () => {
    interface State {
      foo: string
    }

    const selector = createSelector(
      (state: State) => state.foo,
      foo => foo
    )

    expectTypeOf(selector.resultFunc).toBeCallableWith('test')

    expectTypeOf(selector.recomputations).toBeFunction()

    expectTypeOf(selector.resetRecomputations).toBeFunction()

    expectTypeOf(selector({ foo: 'bar' })).toBeString()

    expectTypeOf(selector).parameters.not.toHaveProperty('1')

    expectTypeOf(selector({ foo: 'bar' })).not.toBeNumber()

    // allows heterogeneous parameter type input selectors
    createSelector(
      (state: { foo: string }) => state.foo,
      (state: { bar: number }) => state.bar,
      (foo, bar) => 1
    )

    const selectorWithUnions = createSelector(
      (state: State, val: string | number) => state.foo,
      (state: State, val: string | number) => val,
      (foo, val) => val
    )
  })

  test('selector as combiner', () => {
    interface SubState {
      foo: string
    }

    interface State {
      bar: SubState
    }

    const subSelector = createSelector(
      (state: SubState) => state.foo,
      foo => foo
    )

    const selector = createSelector((state: State) => state.bar, subSelector)

    expectTypeOf(selector).parameter(0).not.toMatchTypeOf({ foo: '' })

    expectTypeOf(selector({ bar: { foo: '' } })).not.toBeNumber()

    expectTypeOf(selector({ bar: { foo: '' } })).toBeString()
  })

  test('connect', () => {
    connect(
      createSelector(
        (state: { foo: string }) => state.foo,
        foo => ({ foo })
      )
    )(props => {
      expectTypeOf(props).not.toHaveProperty('bar')

      expectTypeOf(props).toHaveProperty('foo').toBeString()
    })

    const selector2 = createSelector(
      (state: { foo: string }) => state.foo,
      (state: { baz: number }, props: { bar: number }) => props.bar,
      (foo, bar) => ({ foo, baz: bar })
    )

    const connected = connect(selector2)(props => {
      expectTypeOf(props).toHaveProperty('foo').toBeString()

      expectTypeOf(props).toHaveProperty('bar').toBeNumber()

      expectTypeOf(props).toHaveProperty('baz').toBeNumber()

      expectTypeOf(props).not.toHaveProperty('fizz')
    })

    expectTypeOf(connected).toBeCallableWith({ bar: 42 })

    expectTypeOf(connected)
      .parameter(0)
      .not.toMatchTypeOf({ bar: 42, baz: 123 })
  })

  test('invalid type in combiner', () => {
    // @ts-expect-error
    createSelector(
      (state: { foo: string }) => state.foo,
      (foo: number) => foo
    )

    createSelector(
      (state: { foo: string; bar: number; baz: boolean }) => state.foo,
      (state: any) => state.bar,
      (state: any) => state.baz,
      // @ts-expect-error
      (foo: string, bar: number, baz: boolean, fizz: string) => {}
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
        foo9: string[]
      ) => {
        return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
      }
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
        (state: { testStringArray: string[] }) => state.testStringArray
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
        foo9: string[]
      ) => {
        return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
      }
    )
  })

  test('parametric selector', () => {
    interface State {
      foo: string
    }

    interface Props {
      bar: number
    }

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
        foo9: string[]
      ) => {
        return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
      }
    )

    expectTypeOf(selector1).toBeCallableWith({
      testString: 'a',
      testNumber: 42,
      testBoolean: true,
      testStringArray: ['b', 'c']
    })

    const selector = createSelector(
      (state: State) => state.foo,
      (state: State, props: Props) => props.bar,
      (foo, bar) => ({ foo, bar })
    )

    // @ts-expect-error
    selector({ foo: 'fizz' })
    // @ts-expect-error
    selector({ foo: 'fizz' }, { bar: 'baz' })

    const ret = selector({ foo: 'fizz' }, { bar: 42 })

    expectTypeOf(ret).toHaveProperty('foo').toBeString()

    expectTypeOf(ret).toHaveProperty('bar').toBeNumber()

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
        bar
      })
    )

    expectTypeOf(selector2).toBeCallableWith({ foo: 'fizz' }, { bar: 42 })

    const selector3 = createSelector(
      (s: State) => s.foo,
      (s: State, x: string) => x,
      (s: State, y: number) => y,
      (v, x) => {
        return x + v
      }
    )

    expectTypeOf(selector3).parameter(1).toBeNever()

    const selector4 = createSelector(
      (s: State, val: number) => s.foo,
      (s: State, val: string | number) => val,
      (foo, val) => {
        return val
      }
    )

    expectTypeOf(selector4).toBeCallableWith({ foo: 'fizz' }, 42)
  })

  test('array argument', () => {
    const selector = createSelector(
      [
        (state: { foo: string }) => state.foo,
        (state: { foo: string }) => state.foo,
        (state: { foo: string }, props: { bar: number }) => props.bar
      ],
      (foo1, foo2, bar) => ({ foo1, foo2, bar })
    )

    const ret = selector({ foo: 'fizz' }, { bar: 42 })

    expectTypeOf(ret).toHaveProperty('foo1').toBeString()

    expectTypeOf(ret).toHaveProperty('foo2').toBeString()

    expectTypeOf(ret).toHaveProperty('bar').toBeNumber()

    // @ts-expect-error
    createSelector([(state: { foo: string }) => state.foo])

    // @ts-expect-error
    createSelector(
      [
        (state: { foo: string }) => state.foo,
        (state: { foo: string }) => state.foo
      ],
      (foo: string, bar: number) => {}
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
        (state: { foo: string }) => state.foo
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
        foo10: string
      ) => {}
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
        (state: { foo: string }) => state.foo
      ],
      (
        foo1,
        foo2,
        foo3,
        foo4,
        foo5,
        foo6,
        foo7,
        foo8: number,
        foo9,
        foo10
      ) => {}
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
        1
      ],
      // We expect an error here, but the error differs between TS versions
      // @ts-ignore
      (foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9) => {}
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
        (state: { foo: string }) => state.foo
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
        foo9: string
      ) => {
        return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
      }
    )

    {
      const ret = selector2({ foo: 'fizz' })

      expectTypeOf(ret).toHaveProperty('foo1').toBeString()

      expectTypeOf(ret).toHaveProperty('foo2').toBeString()

      expectTypeOf(ret).toHaveProperty('foo3').toBeString()

      expectTypeOf(ret).toHaveProperty('foo4').toBeString()

      expectTypeOf(ret).toHaveProperty('foo5').toBeString()

      expectTypeOf(ret).toHaveProperty('foo6').toBeString()

      expectTypeOf(ret).toHaveProperty('foo7').toBeString()

      expectTypeOf(ret).toHaveProperty('foo8').toBeString()

      expectTypeOf(ret).toHaveProperty('foo9').toBeString()

      expectTypeOf(ret).not.toHaveProperty('foo10')
    }

    expectTypeOf(selector2).parameters.not.toHaveProperty('1')

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
        (state: { foo: string }) => state.foo
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
        foo8: string
      ) => {
        return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, bar }
      }
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
        (state: { testStringArray: string[] }) => state.testStringArray
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
        foo9: string[]
      ) => {
        return { foo1, foo2, foo3, foo4, foo5, foo6, foo7, foo8, foo9 }
      }
    )

    // @ts-expect-error
    parametric({ foo: 'fizz' })

    {
      const ret = parametric({ foo: 'fizz' }, { bar: 42 })

      expectTypeOf(ret).toHaveProperty('foo1').toBeString()

      expectTypeOf(ret).toHaveProperty('foo2').toBeString()

      expectTypeOf(ret).toHaveProperty('foo3').toBeString()

      expectTypeOf(ret).toHaveProperty('foo4').toBeString()

      expectTypeOf(ret).toHaveProperty('foo5').toBeString()

      expectTypeOf(ret).toHaveProperty('foo6').toBeString()

      expectTypeOf(ret).toHaveProperty('foo7').toBeString()

      expectTypeOf(ret).toHaveProperty('foo8').toBeString()

      expectTypeOf(ret).toHaveProperty('bar').toBeNumber()

      expectTypeOf(ret).not.toHaveProperty('foo9')
    }
  })

  test('optional arguments conflicting', () => {
    interface State {
      foo: string
      bar: number
      baz: boolean
    }

    const selector = createSelector(
      (state: State) => state.baz,
      (state: State, arg: string) => arg,
      (state: State, arg: number) => arg,
      baz => {
        expectTypeOf(baz).toBeBoolean()

        expectTypeOf(baz).not.toBeNumber()
      }
    )

    // @ts-expect-error the selector above has inconsistent conflicting arguments so usage should error
    selector({} as State)
    // @ts-expect-error
    selector({} as State, 'string')
    // @ts-expect-error
    selector({} as State, 1)

    const selector2 = createSelector(
      (state: State, prefix: any) => prefix + state.foo,
      str => str
    )

    // @ts-expect-error here we require one argument which can be anything so error if there are no arguments
    selector2({} as State)
    // no error passing anything in
    selector2({} as State, 'blach')
    selector2({} as State, 1)

    // here the argument is optional so it should be possible to omit the argument or pass anything
    const selector3 = createSelector(
      (state: State, prefix?: any) => prefix + state.foo,
      str => str
    )

    selector3({} as State)
    selector3({} as State, 1)
    selector3({} as State, 'blach')

    // https://github.com/reduxjs/reselect/issues/563
    const selector4 = createSelector(
      (state: State, prefix: string, suffix: any) =>
        prefix + state.foo + String(suffix),
      str => str
    )

    // @ts-expect-error
    selector4({} as State)
    // @ts-expect-error
    selector4({} as State, 'blach')

    expectTypeOf(selector4).toBeCallableWith({} as State, 'blach', 4)

    // as above but a unknown 2nd argument
    const selector5 = createSelector(
      (state: State, prefix: string, suffix: unknown) =>
        prefix + state.foo + String(suffix),
      str => str
    )

    // @ts-expect-error
    selector5({} as State)
    // @ts-expect-error
    selector5({} as State, 'blach')

    expectTypeOf(selector5).toBeCallableWith({} as State, 'blach', 4)

    // this is an example fixing selector6. We have to add a un-necessary typing in and magically the types are correct
    const selector7 = createSelector(
      (state: State, prefix: string = 'a') => prefix + state.foo,
      (str: string) => str
    )

    expectTypeOf(selector7).toBeCallableWith({} as State)

    expectTypeOf(selector7).toBeCallableWith({} as State, 'blach')

    // @ts-expect-error wrong type
    selector7({} as State, 1)

    const selector8 = createSelector(
      (state: State, prefix: unknown) => prefix,
      str => str
    )

    // @ts-expect-error needs a argument
    selector8({} as State)

    // allowed to pass anything as the type is unknown
    expectTypeOf(selector8).toBeCallableWith({} as State, 'blach')

    expectTypeOf(selector8).toBeCallableWith({} as State, 2)
  })

  test('dynamic array argument', () => {
    interface Elem {
      val1: string
      val2: string
    }
    const data: ReadonlyArray<Elem> = [
      { val1: 'a', val2: 'aa' },
      { val1: 'b', val2: 'bb' }
    ]

    createSelector(
      data.map(obj => () => obj.val1),
      (...vals) => vals.join(',')
    )

    createSelector(
      data.map(obj => () => obj.val1),
      // @ts-expect-error
      vals => vals.join(',')
    )

    createSelector(
      data.map(obj => () => obj.val1),
      (...vals: string[]) => 0
    )
    // @ts-expect-error
    createSelector(
      data.map(obj => () => obj.val1),
      (...vals: number[]) => 0
    )

    const s = createSelector(
      data.map(obj => (state: StateA, fld: keyof Elem) => obj[fld]),
      (...vals) => vals.join(',')
    )
    s({ a: 42 }, 'val1')
    s({ a: 42 }, 'val2')
    // @ts-expect-error
    s({ a: 42 }, 'val3')
  })

  test('issue #445: Typescript validation issues when passing function to combiner', () => {
    // https://github.com/reduxjs/reselect/issues/445

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
        str
      }
    }
    function generateObject2(num: number): Object2 {
      return {
        num
      }
    }
    function generateComplexObject(
      num: number,
      subObject: Object1,
      subObject2: Object2
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
      generateComplexObject
    )

    // Does error, but error is really weird and talks about "Object1 is not assignable to type number"
    // @ts-expect-error
    const getComplexObjectTest2 = createSelector(
      [getNumber, getObject1],
      generateComplexObject
    )

    // Should error because number can't be null
    // @ts-expect-error
    const getComplexObjectTest3 = createSelector(
      [getNumber, getObject1, getObject2],
      generateComplexObject
    )

    // Does error, but error is really weird and talks about "Object1 is not assignable to type number"
    // @ts-expect-error
    const getComplexObjectTest4 = createSelector(
      [getObject1, getNumber, getObject2],
      generateComplexObject
    )

    // Verbose selector examples

    // Errors correctly, says str can't be null
    const getVerboseObject1 = createSelector([getString], str =>
      // @ts-expect-error
      generateObject1(str)
    )

    // Errors correctly, says num can't be null
    const getVerboseObject2 = createSelector([getNumber], num =>
      // @ts-expect-error
      generateObject2(num)
    )

    // Errors correctly
    const getVerboseComplexObjectTest1 = createSelector([getObject1], obj1 =>
      // @ts-expect-error
      generateComplexObject(obj1)
    )

    // Errors correctly
    const getVerboseComplexObjectTest2 = createSelector(
      [getNumber, getObject1],
      // @ts-expect-error
      (num, obj1) => generateComplexObject(num, obj1)
    )

    // Errors correctly
    const getVerboseComplexObjectTest3 = createSelector(
      [getNumber, getObject1, getObject2],
      // @ts-expect-error
      (num, obj1, obj2) => generateComplexObject(num, obj1, obj2)
    )

    // Errors correctly
    const getVerboseComplexObjectTest4 = createSelector(
      [getObject1, getNumber, getObject2],
      // @ts-expect-error
      (num, obj1, obj2) => generateComplexObject(num, obj1, obj2)
    )
  })

  test('issue #492: Props argument types not merged correctly with overlapping keys', () => {
    // https://github.com/reduxjs/reselect/issues/492

    const fooPropSelector = (_: {}, ownProps: { foo: string }) => ownProps.foo
    const fooBarPropsSelector = (
      _: {},
      ownProps: { foo: string; bar: string }
    ) => [ownProps.foo, ownProps.bar]

    const combinedSelector = createSelector(
      fooPropSelector,
      fooBarPropsSelector,
      (foo, fooBar) => fooBar
    )
  })

  test('ensure that input selectors with mismatched states raise errors', () => {
    const input1 = (state: string) => 1
    const input2 = (state: number) => 2

    const selector = createSelector(input1, input2, (...args) => 0)
    // @ts-expect-error
    selector('foo')
    // @ts-expect-error
    selector(5)

    const selector1 = createSelector(
      (state: { foo: string }) => 1,
      (state: { bar: string }) => 2,
      (...args) => 0
    )
    selector1({ foo: '', bar: '' })
    // @ts-expect-error
    selector1({ foo: '' })
    // @ts-expect-error
    selector1({ bar: '' })

    const selector2 = createSelector(
      (state: { foo: string }) => 1,
      (state: { foo: string }) => 2,
      (...args) => 0
    )
    // @ts-expect-error
    selector2({ foo: '', bar: '' })
    selector2({ foo: '' })
    // @ts-expect-error
    selector2({ bar: '' })
  })

  test('issue #526: input selector with undefined return', () => {
    // https://github.com/reduxjs/reselect/issues/526

    interface Input {
      field: number | undefined
    }

    type Output = string

    type SelectorType = (input: Input) => Output

    const input = ({ field }: Input) => field

    const result = (out: number | undefined): Output => 'test'

    // Make sure the selector type is honored
    const selector: SelectorType = createSelector(
      ({ field }: Input) => field,
      args => 'test'
    )

    // even when memoizeOptions are passed
    const selector2: SelectorType = createSelector(
      ({ field }: Input) => field,
      args => 'test',
      {
        memoize: lruMemoize,
        memoizeOptions: { maxSize: 42 }
      }
    )

    // Make sure inference of functions works...
    const selector3: SelectorType = createSelector(input, result)
    const selector4: SelectorType = createSelector(input, result, {
      memoize: lruMemoize,
      memoizeOptions: { maxSize: 42 }
    })
  })

  test('issue #540: Multiple selectors with arguments result in a union type', () => {
    // https://github.com/reduxjs/reselect/issues/540

    const input1 = (
      _: StateA,
      { testNumber }: { testNumber: number },
      c: number,
      d: string
    ) => testNumber

    const input2 = (
      _: StateA,
      { testString }: { testString: string },
      c: number | string
    ) => testString

    const input3 = (
      _: StateA,
      { testBoolean }: { testBoolean: boolean },
      c: number | string,
      d: string
    ) => testBoolean

    const input4 = (_: StateA, { testString2 }: { testString2: string }) =>
      testString2

    const testSelector = createSelector(
      input1,
      input2,
      input3,
      input4,
      (testNumber, testString, testBoolean) => testNumber + testString
    )

    const state: StateA = { a: 42 }
    const test = testSelector(
      state,
      {
        testNumber: 1,
        testString: '10',
        testBoolean: true,
        testString2: 'blah'
      },
      42,
      'blah'
    )

    // #541
    const selectProp1 = createSelector(
      [
        (state: StateA) => state,
        (state: StateA, props: { prop1: number }) => props
      ],
      (state, { prop1 }) => [state, prop1]
    )

    const selectProp2 = createSelector(
      [selectProp1, (state, props: { prop2: number }) => props],
      (state, { prop2 }) => [state, prop2]
    )

    selectProp1({ a: 42 }, { prop1: 1 })
    // @ts-expect-error
    selectProp2({ a: 42 }, { prop2: 2 })
  })

  test('issue #550: createSelector accepts selectors with more than one parameter', () => {
    // https://github.com/reduxjs/reselect/issues/550

    const some = createSelector(
      (a: number) => a,
      (_a: number, b: number) => b,
      (a, b) => a + b
    )

    const test = some(1, 2)
  })

  test('RTK issue #1750: Type conflicts with TypedUseSelectorHook', () => {
    // https://github.com/reduxjs/redux-toolkit/issues/1750

    const slice = createSlice({
      name: 'test',
      initialState: 0,
      reducers: {}
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
          query: name => `pokemon/${name}`
        })
      })
    })

    const store = configureStore({
      reducer: {
        test: slice.reducer,
        [pokemonApi.reducerPath]: pokemonApi.reducer
      },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(pokemonApi.middleware)
    })

    type RootState = ReturnType<typeof store.getState>

    const selectTest = createSelector(
      (state: RootState) => state.test,
      test => test
    )

    const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

    // Selector usage should compile correctly
    const testItem = selectTest(store.getState())

    function App() {
      const test = useAppSelector(selectTest)
      return null
    }
  })

  test('handle nested incompatible types', () => {
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
  })

  test('issue #554a: createSelector should support undefined and optional parameters', () => {
    // https://github.com/reduxjs/reselect/issues/554

    interface State {
      foo: string
      bar: number
    }

    const initialState: State = {
      foo: 'This is Foo',
      bar: 1
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
      }
    )
    complexOne(initialState, 'first')

    const complexTwo = createSelector(
      getFoo,
      getBar,
      firstInput,
      secondInput,
      (foo, bar, first, second) => {
        return `${foo} => ${bar} || ${first} and ${second}`
      }
    )
    // TS should complain since 'second' should be `number`
    // @ts-expect-error
    complexTwo(initialState, 'first', 'second')
  })

  test('issue #554b: createSelector should support undefined and optional parameters', () => {
    // https://github.com/reduxjs/reselect/issues/554

    interface State {
      counter1: number
      counter2: number
    }

    const selectTest = createSelector(
      (state: State, numberA?: number) => numberA,
      (state: State) => state.counter2,
      (numberA, counter2) => (numberA ? numberA + counter2 : counter2)
    )

    type selectTestParams = Parameters<typeof selectTest>
    const p1: selectTestParams = [{ counter1: 1, counter2: 2 }, 42]

    expectTypeOf(p1).toEqualTypeOf<[State, number?]>()

    const result = selectTest({ counter1: 1, counter2: 2 }, 42)
  })

  test('issue #554c: createSelector should support undefined and optional parameters', () => {
    // https://github.com/reduxjs/reselect/issues/554

    interface State {
      counter1: number
      counter2: number
    }

    const selectTest = createSelector(
      (state: State, numberA?: number) => numberA, // `numberA` is optional
      (state: State) => state.counter2,
      (numberA, counter2) => (numberA ? numberA + counter2 : counter2)
    )

    // @ts-expect-error
    const value = selectTest({ counter1: 0, counter2: 0 }, 'what?')

    const selectTest2 = createSelector(
      (state: State, numberA: number) => numberA, // `numberA` is not optional anymore
      (state: State) => state.counter2,
      (numberA, counter2) => (numberA ? numberA + counter2 : counter2)
    )

    // @ts-expect-error
    const value2 = selectTest2({ counter1: 0, counter2: 0 }, 'what?')
  })

  test('issue #555: createSelector should support undefined, null and optional parameters', () => {
    // https://github.com/reduxjs/reselect/issues/555

    interface IReduxState {
      ui: {
        x: string
        y: string
      }
    }

    const someSelector1 = createSelector(
      (state: IReduxState, param: 'x' | 'y' | undefined) =>
        param !== undefined ? state.ui[param] : null,
      (a: string | null) => a
    )

    const someSelector2 = createSelector(
      (state: IReduxState, param?: 'x' | 'y') =>
        param !== undefined ? state.ui[param] : null,
      (a: string | null) => a
    )

    const someSelector3 = createSelector(
      (state: IReduxState, param: 'x' | 'y' | null) =>
        param !== null ? state.ui[param] : null,
      (a: string | null) => a
    )

    const state = { ui: { x: '1', y: '2' } }

    const selectorResult1 = someSelector1(state, undefined)
    const selectorResult2 = someSelector2(state, undefined)
    const selectorResult3 = someSelector3(state, null)
  })

  test('config options', () => {
    const lruMemoizeAcceptsFirstArgDirectly = createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
      {
        memoize: lruMemoize,
        memoizeOptions: (a, b) => a === b
      }
    )

    const lruMemoizeAcceptsFirstArgAsObject = createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
      {
        memoize: lruMemoize,
        memoizeOptions: {
          equalityCheck: (a, b) => a === b
        }
      }
    )

    const lruMemoizeAcceptsArgsAsArray = createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
      {
        memoize: lruMemoize,
        memoizeOptions: [(a, b) => a === b]
      }
    )

    const customSelectorCreatorMicroMemoize = createSelectorCreator(
      microMemoize,
      {
        maxSize: 42
      }
    )

    customSelectorCreatorMicroMemoize(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
      {
        memoizeOptions: [
          {
            maxSize: 42
          }
        ]
      }
    )

    const customSelectorCreatorMemoizeOne = createSelectorCreator(memoizeOne)

    customSelectorCreatorMemoizeOne(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
      {
        memoizeOptions: (a, b) => a === b
      }
    )
  })
})
