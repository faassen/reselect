import microMemoize from 'micro-memoize'
import type { Selector, TypedStructuredSelectorCreator } from 'reselect'
import {
  createSelector,
  createSelectorCreator,
  createStructuredSelector,
  lruMemoize,
  weakMapMemoize
} from 'reselect'
import { describe, expectTypeOf, test } from 'vitest'
import type { StateAB } from '../test/testTypes'

interface Todo {
  id: number
  completed: boolean
}

interface Alert {
  id: number
  read: boolean
}

interface RootState {
  todos: Todo[]
  alerts: Alert[]
}

const rootState: RootState = {
  todos: [
    { id: 0, completed: false },
    { id: 1, completed: true }
  ],
  alerts: [
    { id: 0, read: false },
    { id: 1, read: true }
  ]
}

describe('type tests', () => {
  // TODO: Remove this test block once `TypedStructuredSelectorCreator` is removed.
  test('TypedStructuredSelectorCreator should lock down state type', () => {
    const createStructuredAppSelector: TypedStructuredSelectorCreator<RootState> =
      createStructuredSelector

    const structuredSelector = createStructuredAppSelector({
      todos: state => {
        expectTypeOf(state).toEqualTypeOf(rootState)

        return state.todos
      },
      alerts: state => {
        expectTypeOf(state).toEqualTypeOf(rootState)

        return state.alerts
      }
    })

    const { todos, alerts } = structuredSelector(rootState)

    expectTypeOf(todos).toEqualTypeOf<Todo[]>()

    expectTypeOf(alerts).toEqualTypeOf<Alert[]>()

    expectTypeOf(structuredSelector.argsMemoize).toEqualTypeOf(weakMapMemoize)

    expectTypeOf(structuredSelector.memoize).toEqualTypeOf(weakMapMemoize)

    expectTypeOf(structuredSelector.clearCache).returns.toBeVoid()

    expectTypeOf(structuredSelector.clearCache).parameters.toEqualTypeOf<[]>()

    expectTypeOf(structuredSelector.dependencies).items.toBeFunction()

    expectTypeOf(structuredSelector.dependencyRecomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(structuredSelector.recomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(
      structuredSelector.resetDependencyRecomputations
    ).toEqualTypeOf<() => void>()

    expectTypeOf(structuredSelector.resetRecomputations).toEqualTypeOf<
      () => void
    >()

    expectTypeOf(structuredSelector.lastResult).returns.toEqualTypeOf(rootState)

    expectTypeOf(
      structuredSelector.memoizedResultFunc
    ).parameters.toEqualTypeOf<[Todo[], Alert[]]>()

    expectTypeOf(structuredSelector.memoizedResultFunc).returns.toEqualTypeOf(
      structuredSelector.lastResult()
    )

    expectTypeOf(structuredSelector.memoizedResultFunc).toHaveProperty(
      'clearCache'
    )

    expectTypeOf(structuredSelector.resultFunc).returns.toEqualTypeOf(
      structuredSelector.lastResult()
    )
  })

  // TODO: Remove this test block once `TypedStructuredSelectorCreator` is removed.
  test('TypedStructuredSelectorCreator should correctly infer memoize and argsMemoize', () => {
    const createSelectorLru = createSelectorCreator({
      memoize: lruMemoize,
      argsMemoize: microMemoize
    })

    const createStructuredAppSelector: TypedStructuredSelectorCreator<RootState> =
      createStructuredSelector

    const structuredSelector = createStructuredAppSelector(
      {
        todos: state => state.todos,
        alerts: state => state.alerts
      },
      createSelectorLru
    )

    expectTypeOf(structuredSelector.argsMemoize).toEqualTypeOf(microMemoize)

    expectTypeOf(structuredSelector.memoize).toEqualTypeOf(lruMemoize)

    const { todos, alerts } = structuredSelector(rootState)

    expectTypeOf(todos).toEqualTypeOf<Todo[]>()

    expectTypeOf(alerts).toEqualTypeOf<Alert[]>()

    expectTypeOf(structuredSelector.dependencies).items.toBeFunction()

    expectTypeOf(structuredSelector.dependencyRecomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(structuredSelector.recomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(
      structuredSelector.resetDependencyRecomputations
    ).toEqualTypeOf<() => void>()

    expectTypeOf(structuredSelector.resetRecomputations).toEqualTypeOf<
      () => void
    >()

    expectTypeOf(structuredSelector.lastResult).returns.toEqualTypeOf(rootState)

    expectTypeOf(
      structuredSelector.memoizedResultFunc
    ).parameters.toEqualTypeOf<[Todo[], Alert[]]>()

    expectTypeOf(structuredSelector.memoizedResultFunc).returns.toEqualTypeOf(
      structuredSelector.lastResult()
    )

    expectTypeOf(structuredSelector.memoizedResultFunc).toHaveProperty(
      'clearCache'
    )

    expectTypeOf(structuredSelector.resultFunc).returns.toEqualTypeOf(
      structuredSelector.lastResult()
    )
  })

  test('supports additional parameters', () => {
    const structuredSelector = createStructuredSelector({
      todos: (state: RootState) => state.todos,
      alerts: (state: RootState) => state.alerts,
      todoById: (state: RootState, id: number) => state.todos[id]
    })

    const { alerts, todos, todoById } = structuredSelector(rootState, 0)

    expectTypeOf(todos).toEqualTypeOf<Todo[]>()

    expectTypeOf(alerts).toEqualTypeOf<Alert[]>()

    expectTypeOf(todoById).toEqualTypeOf<Todo>()

    expectTypeOf(structuredSelector.argsMemoize).toEqualTypeOf(weakMapMemoize)

    expectTypeOf(structuredSelector.memoize).toEqualTypeOf(weakMapMemoize)

    expectTypeOf(structuredSelector.clearCache).returns.toBeVoid()

    expectTypeOf(structuredSelector.clearCache).parameters.toEqualTypeOf<[]>()

    expectTypeOf(structuredSelector.dependencies).items.toMatchTypeOf<
      Selector<RootState>
    >()

    expectTypeOf(structuredSelector.dependencyRecomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(structuredSelector.recomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(
      structuredSelector.resetDependencyRecomputations
    ).returns.toBeVoid()

    expectTypeOf(
      structuredSelector.resetDependencyRecomputations
    ).parameters.items.toBeNever()

    expectTypeOf(structuredSelector.resetRecomputations).returns.toBeVoid()

    expectTypeOf(
      structuredSelector.resetRecomputations
    ).parameters.items.toBeNever()

    // Use `.branded` for intersection types https://github.com/mmkal/expect-type#why-is-my-assertion-failing
    expectTypeOf(structuredSelector.lastResult).returns.branded.toEqualTypeOf<
      RootState & { todoById: Todo }
    >()

    expectTypeOf(
      structuredSelector.memoizedResultFunc
    ).parameters.toEqualTypeOf<[Todo[], Alert[], Todo]>()

    expectTypeOf(structuredSelector.resultFunc).parameters.toEqualTypeOf<
      [Todo[], Alert[], Todo]
    >()

    expectTypeOf(structuredSelector.memoizedResultFunc).returns.toEqualTypeOf(
      structuredSelector.lastResult()
    )

    expectTypeOf(structuredSelector.memoizedResultFunc).toHaveProperty(
      'clearCache'
    )

    expectTypeOf(structuredSelector.resultFunc).returns.toEqualTypeOf(
      structuredSelector.lastResult()
    )
  })

  test('automatic inference of types for createStructuredSelector', () => {
    const oneParamSelector = createStructuredSelector({
      foo: (state: StateAB) => state.a,
      bar: (state: StateAB) => state.b
    })

    const threeParamSelector = createStructuredSelector({
      foo: (state: StateAB, c: number, d: string) => state.a,
      bar: (state: StateAB, c: number, d: string) => state.b
    })

    interface State {
      foo: string
    }

    const FooSelector = (state: State, a: number, b: string) => state.foo
    const BarSelector = (state: State, a: number, b: string) => +state.foo

    const selector2 = createStructuredSelector({
      foo: FooSelector,
      bar: BarSelector
    })

    const selectorGenerics = createStructuredSelector<{
      foo: typeof FooSelector
      bar: typeof BarSelector
    }>({
      foo: state => state.foo,
      bar: state => +state.foo
    })

    interface ExpectedResult {
      foo: string
      bar: number
    }

    const resOneParam = oneParamSelector({ a: 1, b: 2 })
    const resThreeParams = threeParamSelector({ a: 1, b: 2 }, 99, 'blah')
    const res3: ExpectedResult = selector2({ foo: '42' }, 99, 'test')
    const resGenerics: ExpectedResult = selectorGenerics(
      { foo: '42' },
      99,
      'test'
    )

    //@ts-expect-error
    selector2({ bar: '42' })
    // @ts-expect-error
    selectorGenerics({ bar: '42' })
  })

  test('structured selector type parameters', () => {
    interface GlobalState {
      foo: string
      bar: number
    }

    const selectFoo = (state: GlobalState) => state.foo
    const selectBar = (state: GlobalState) => state.bar

    // Output state should be the same as input, if not provided
    // @ts-expect-error
    createStructuredSelector<GlobalState>({
      foo: selectFoo
      // bar: selectBar,
      // ^^^ because this is missing, an error is thrown
    })
  })

  test("issue #548: createStructuredSelector doesn't infer props typings", () => {
    // https://github.com/reduxjs/reselect/issues/548

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
      ({ loading }, currency) => loading
    )

    const mapData = createStructuredSelector({
      isLoading,
      test2: (state: State) => 42
    })

    const result = mapData({ value: null, loading: false }, { currency: 'EUR' })
  })

  test('verify structured selector matches createSelector in output structure and type definitions', () => {
    // A structured selector created by `createStructuredSelector`
    // is the same as a selector created by `createSelector` when it
    // returns an object made up of selectors

    const createSelectorMicro = createSelectorCreator({
      memoize: microMemoize,
      argsMemoize: microMemoize
    })

    const selector = createSelectorMicro(
      [
        (state: RootState) => state.todos,
        (state: RootState) => state.alerts,
        (state: RootState, id: number) => state.todos[id]
      ],
      (todos, alerts, todoById) => ({ todos, alerts, todoById })
    )

    const structuredSelector = createStructuredSelector(
      {
        todos: (state: RootState) => state.todos,
        alerts: (state: RootState) => state.alerts,
        todoById: (state: RootState, id: number) => state.todos[id]
      },

      createSelectorMicro
    )

    expectTypeOf(structuredSelector).toEqualTypeOf(selector)

    expectTypeOf(structuredSelector.memoizedResultFunc).toHaveProperty('cache')

    expectTypeOf(structuredSelector.memoizedResultFunc).toHaveProperty('fn')

    expectTypeOf(structuredSelector.memoizedResultFunc).toHaveProperty(
      'isMemoized'
    )

    expectTypeOf(structuredSelector.memoizedResultFunc).toHaveProperty(
      'options'
    )
    expectTypeOf(selector.memoizedResultFunc).toHaveProperty('cache')

    expectTypeOf(selector.memoizedResultFunc).toHaveProperty('fn')

    expectTypeOf(selector.memoizedResultFunc).toHaveProperty('isMemoized')

    expectTypeOf(selector.memoizedResultFunc).toHaveProperty('options')

    expectTypeOf(structuredSelector.argsMemoize).toEqualTypeOf(microMemoize)

    expectTypeOf(structuredSelector.memoize).toEqualTypeOf(microMemoize)

    expectTypeOf(structuredSelector.dependencies).toEqualTypeOf<
      [
        (state: RootState) => Todo[],
        (state: RootState) => Alert[],
        (state: RootState, id: number) => Todo
      ]
    >()

    // @ts-expect-error Wrong number of arguments.
    structuredSelector(state, 2)
  })
})
