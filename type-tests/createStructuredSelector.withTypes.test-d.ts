import microMemoize from 'micro-memoize'
import type {
  Selector,
  StructuredSelectorCreator,
  TypedStructuredSelectorCreator
} from 'reselect'
import {
  createSelector,
  createSelectorCreator,
  createStructuredSelector,
  lruMemoize,
  weakMapMemoize
} from 'reselect'
import { describe, expectTypeOf, test } from 'vitest'

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
    { id: 1, completed: false }
  ],
  alerts: [
    { id: 0, read: false },
    { id: 1, read: false }
  ]
}

describe('type tests', () => {
  const createStructuredAppSelector =
    createStructuredSelector.withTypes<RootState>()

  test('locks down state type and infers types correctly', () => {
    expectTypeOf(createStructuredSelector.withTypes).returns.toEqualTypeOf(
      createStructuredSelector
    )

    const structuredAppSelector = createStructuredAppSelector({
      todos: state => {
        expectTypeOf(state).toEqualTypeOf(rootState)

        return state.todos
      },
      alerts: state => {
        expectTypeOf(state).toEqualTypeOf(rootState)

        return state.alerts
      }
    })

    const { todos, alerts } = structuredAppSelector(rootState)

    expectTypeOf(todos).toEqualTypeOf<Todo[]>()

    expectTypeOf(alerts).toEqualTypeOf<Alert[]>()

    expectTypeOf(structuredAppSelector.argsMemoize).toEqualTypeOf(
      weakMapMemoize
    )

    expectTypeOf(structuredAppSelector.memoize).toEqualTypeOf(weakMapMemoize)

    expectTypeOf(structuredAppSelector.clearCache).returns.toBeVoid()

    expectTypeOf(structuredAppSelector.clearCache).parameters.toEqualTypeOf<
      []
    >()

    expectTypeOf(structuredAppSelector.dependencies).items.toBeFunction()

    expectTypeOf(structuredAppSelector.dependencyRecomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(structuredAppSelector.recomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(
      structuredAppSelector.resetDependencyRecomputations
    ).toEqualTypeOf<() => void>()

    expectTypeOf(structuredAppSelector.resetRecomputations).toEqualTypeOf<
      () => void
    >()

    expectTypeOf(structuredAppSelector.lastResult).returns.toEqualTypeOf(
      rootState
    )

    expectTypeOf(
      structuredAppSelector.memoizedResultFunc
    ).parameters.toEqualTypeOf<[Todo[], Alert[]]>()

    expectTypeOf(
      structuredAppSelector.memoizedResultFunc
    ).returns.toEqualTypeOf(structuredAppSelector.lastResult())

    expectTypeOf(structuredAppSelector.memoizedResultFunc).toHaveProperty(
      'clearCache'
    )

    expectTypeOf(structuredAppSelector.resultFunc).returns.toEqualTypeOf(
      structuredAppSelector.lastResult()
    )
  })

  test('should correctly infer memoize and argsMemoize', () => {
    const createSelectorLru = createSelectorCreator({
      memoize: lruMemoize,
      argsMemoize: microMemoize
    })

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
    const structuredAppSelector = createStructuredAppSelector({
      todos: state => {
        expectTypeOf(state).toEqualTypeOf(rootState)

        return state.todos
      },
      alerts: state => {
        expectTypeOf(state).toEqualTypeOf(rootState)

        return state.alerts
      },
      todoById: (state, id: number) => {
        expectTypeOf(state).toEqualTypeOf(rootState)

        return state.todos[id]
      }
    })

    const { alerts, todos, todoById } = structuredAppSelector(rootState, 0)

    expectTypeOf(todos).toEqualTypeOf<Todo[]>()

    expectTypeOf(alerts).toEqualTypeOf<Alert[]>()

    expectTypeOf(todoById).toEqualTypeOf<Todo>()

    expectTypeOf(structuredAppSelector.argsMemoize).toEqualTypeOf(
      weakMapMemoize
    )

    expectTypeOf(structuredAppSelector.memoize).toEqualTypeOf(weakMapMemoize)

    expectTypeOf(structuredAppSelector.clearCache).returns.toBeVoid()

    expectTypeOf(structuredAppSelector.clearCache).parameters.toEqualTypeOf<
      []
    >()

    expectTypeOf(structuredAppSelector.dependencies).items.toMatchTypeOf<
      Selector<RootState>
    >()

    expectTypeOf(structuredAppSelector.dependencyRecomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(structuredAppSelector.recomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(
      structuredAppSelector.resetDependencyRecomputations
    ).returns.toBeVoid()

    expectTypeOf(
      structuredAppSelector.resetDependencyRecomputations
    ).parameters.items.toBeNever()

    expectTypeOf(structuredAppSelector.resetRecomputations).returns.toBeVoid()

    expectTypeOf(
      structuredAppSelector.resetRecomputations
    ).parameters.items.toBeNever()

    // Use `.branded` for intersection types https://github.com/mmkal/expect-type#why-is-my-assertion-failing
    expectTypeOf(
      structuredAppSelector.lastResult
    ).returns.branded.toEqualTypeOf<RootState & { todoById: Todo }>()

    expectTypeOf(
      structuredAppSelector.memoizedResultFunc
    ).parameters.toEqualTypeOf<[Todo[], Alert[], Todo]>()

    expectTypeOf(structuredAppSelector.resultFunc).parameters.toEqualTypeOf<
      [Todo[], Alert[], Todo]
    >()

    expectTypeOf(
      structuredAppSelector.memoizedResultFunc
    ).returns.toEqualTypeOf(structuredAppSelector.lastResult())

    expectTypeOf(structuredAppSelector.memoizedResultFunc).toHaveProperty(
      'clearCache'
    )

    expectTypeOf(structuredAppSelector.resultFunc).returns.toEqualTypeOf(
      structuredAppSelector.lastResult()
    )
  })

  // TODO: Remove this test block once `TypedStructuredSelectorCreator` is removed.
  test('should work alongside TypedStructuredSelectorCreator', () => {
    const createStructuredAppSelector: TypedStructuredSelectorCreator<RootState> =
      createStructuredSelector.withTypes<RootState>()

    const structuredAppSelector = createStructuredAppSelector({
      todos: state => {
        expectTypeOf(state).toEqualTypeOf(rootState)

        return state.todos
      },
      alerts: state => {
        expectTypeOf(state).toEqualTypeOf(rootState)

        return state.alerts
      }
    })

    const { todos, alerts } = structuredAppSelector(rootState)

    expectTypeOf(todos).toEqualTypeOf<Todo[]>()

    expectTypeOf(alerts).toEqualTypeOf<Alert[]>()

    expectTypeOf(structuredAppSelector.argsMemoize).toEqualTypeOf(
      weakMapMemoize
    )

    expectTypeOf(structuredAppSelector.memoize).toEqualTypeOf(weakMapMemoize)

    expectTypeOf(structuredAppSelector.clearCache).returns.toBeVoid()

    expectTypeOf(structuredAppSelector.clearCache).parameters.toEqualTypeOf<
      []
    >()

    expectTypeOf(structuredAppSelector.dependencies).items.toBeFunction()

    expectTypeOf(structuredAppSelector.dependencyRecomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(structuredAppSelector.recomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(
      structuredAppSelector.resetDependencyRecomputations
    ).toEqualTypeOf<() => void>()

    expectTypeOf(structuredAppSelector.resetRecomputations).toEqualTypeOf<
      () => void
    >()

    expectTypeOf(structuredAppSelector.lastResult).returns.toEqualTypeOf(
      rootState
    )

    expectTypeOf(
      structuredAppSelector.memoizedResultFunc
    ).parameters.toEqualTypeOf<[Todo[], Alert[]]>()

    expectTypeOf(
      structuredAppSelector.memoizedResultFunc
    ).returns.toEqualTypeOf(structuredAppSelector.lastResult())

    expectTypeOf(structuredAppSelector.memoizedResultFunc).toHaveProperty(
      'clearCache'
    )

    expectTypeOf(structuredAppSelector.resultFunc).returns.toEqualTypeOf(
      structuredAppSelector.lastResult()
    )
  })

  test('should work with createSelector.withTypes<RootState>()', () => {
    const structuredAppSelector = createStructuredAppSelector(
      {
        todos: state => {
          expectTypeOf(state).toEqualTypeOf(rootState)

          return state.todos
        },
        alerts: state => {
          expectTypeOf(state).toEqualTypeOf(rootState)

          return state.alerts
        }
      },
      createSelector.withTypes<RootState>()
    )

    const { todos, alerts } = structuredAppSelector(rootState)

    expectTypeOf(todos).toEqualTypeOf<Todo[]>()

    expectTypeOf(alerts).toEqualTypeOf<Alert[]>()

    expectTypeOf(structuredAppSelector.argsMemoize).toEqualTypeOf(
      weakMapMemoize
    )

    expectTypeOf(structuredAppSelector.memoize).toEqualTypeOf(weakMapMemoize)

    expectTypeOf(structuredAppSelector.clearCache).returns.toBeVoid()

    expectTypeOf(structuredAppSelector.clearCache).parameters.toEqualTypeOf<
      []
    >()

    expectTypeOf(structuredAppSelector.dependencies).items.toBeFunction()

    expectTypeOf(structuredAppSelector.dependencyRecomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(structuredAppSelector.recomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(
      structuredAppSelector.resetDependencyRecomputations
    ).toEqualTypeOf<() => void>()

    expectTypeOf(structuredAppSelector.resetRecomputations).toEqualTypeOf<
      () => void
    >()

    expectTypeOf(structuredAppSelector.lastResult).returns.toEqualTypeOf(
      rootState
    )

    expectTypeOf(
      structuredAppSelector.memoizedResultFunc
    ).parameters.toEqualTypeOf<[Todo[], Alert[]]>()

    expectTypeOf(
      structuredAppSelector.memoizedResultFunc
    ).returns.toEqualTypeOf(structuredAppSelector.lastResult())

    expectTypeOf(structuredAppSelector.memoizedResultFunc).toHaveProperty(
      'clearCache'
    )

    expectTypeOf(structuredAppSelector.resultFunc).returns.toEqualTypeOf(
      structuredAppSelector.lastResult()
    )
  })

  test('StructuredSelectorCreator should lock down the state type', () => {
    const createStructuredAppSelector: StructuredSelectorCreator<RootState> =
      createStructuredSelector

    const structuredAppSelector = createStructuredAppSelector(
      {
        todos: state => {
          expectTypeOf(state).toEqualTypeOf(rootState)

          return state.todos
        },
        alerts: state => {
          expectTypeOf(state).toEqualTypeOf(rootState)

          return state.alerts
        }
      },
      createSelector.withTypes<RootState>()
    )

    const { todos, alerts } = structuredAppSelector(rootState)

    expectTypeOf(todos).toEqualTypeOf<Todo[]>()

    expectTypeOf(alerts).toEqualTypeOf<Alert[]>()

    expectTypeOf(structuredAppSelector.argsMemoize).toEqualTypeOf(
      weakMapMemoize
    )

    expectTypeOf(structuredAppSelector.memoize).toEqualTypeOf(weakMapMemoize)

    expectTypeOf(structuredAppSelector.clearCache).returns.toBeVoid()

    expectTypeOf(structuredAppSelector.clearCache).parameters.toEqualTypeOf<
      []
    >()

    expectTypeOf(structuredAppSelector.dependencies).items.toBeFunction()

    expectTypeOf(structuredAppSelector.dependencyRecomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(structuredAppSelector.recomputations).toEqualTypeOf<
      () => number
    >()

    expectTypeOf(
      structuredAppSelector.resetDependencyRecomputations
    ).toEqualTypeOf<() => void>()

    expectTypeOf(structuredAppSelector.resetRecomputations).toEqualTypeOf<
      () => void
    >()

    expectTypeOf(structuredAppSelector.lastResult).returns.toEqualTypeOf(
      rootState
    )

    expectTypeOf(
      structuredAppSelector.memoizedResultFunc
    ).parameters.toEqualTypeOf<[Todo[], Alert[]]>()

    expectTypeOf(
      structuredAppSelector.memoizedResultFunc
    ).returns.toEqualTypeOf(structuredAppSelector.lastResult())

    expectTypeOf(structuredAppSelector.memoizedResultFunc).toHaveProperty(
      'clearCache'
    )

    expectTypeOf(structuredAppSelector.resultFunc).returns.toEqualTypeOf(
      structuredAppSelector.lastResult()
    )
  })
})
