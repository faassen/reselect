import { createSelector } from 'reselect'
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
    { id: 1, completed: false },
  ],
  alerts: [
    { id: 0, read: false },
    { id: 1, read: false },
  ],
}

describe('createSelector.withTypes<RootState>()', () => {
  const createAppSelector = createSelector.withTypes<RootState>()

  describe('when input selectors are provided as a single array', () => {
    test('locks down state type and infers result function parameter types correctly', () => {
      expectTypeOf(createSelector.withTypes).returns.toEqualTypeOf(
        createSelector,
      )

      // Type of state is locked and the parameter types of the result function
      // are correctly inferred when input selectors are provided as a single array.
      createAppSelector(
        [
          state => {
            expectTypeOf(state).toEqualTypeOf<RootState>(rootState)

            return state.todos
          },
        ],
        todos => {
          expectTypeOf(todos).toEqualTypeOf<Todo[]>(rootState.todos)

          return todos.map(({ id }) => id)
        },
      )
    })
  })

  describe('when input selectors are provided as separate inline arguments', () => {
    test('locks down state type but does not infer result function parameter types', () => {
      // Type of state is locked but the parameter types of the
      // result function are NOT correctly inferred when
      // input selectors are provided as separate inline arguments.
      createAppSelector(
        state => {
          expectTypeOf(state).toEqualTypeOf<RootState>(rootState)

          return state.todos
        },
        todos => {
          // Known limitation: Parameter types are not inferred in this scenario
          expectTypeOf(todos).toBeAny()

          expectTypeOf(todos).not.toEqualTypeOf<Todo[]>(rootState.todos)

          // @ts-expect-error A typed `createSelector` currently only infers
          // the parameter types of the result function when
          // input selectors are provided as a single array.
          return todos.map(({ id }) => id)
        },
      )
    })

    test('handles multiple input selectors with separate inline arguments', () => {
      // Checking to see if the type of state is correct when multiple
      // input selectors are provided as separate inline arguments.
      createAppSelector(
        state => {
          expectTypeOf(state).toEqualTypeOf<RootState>(rootState)

          return state.todos
        },
        state => {
          expectTypeOf(state).toEqualTypeOf<RootState>(rootState)

          return state.alerts
        },
        (todos, alerts) => {
          // Known limitation: Parameter types are not inferred in this scenario
          expectTypeOf(todos).toBeAny()

          expectTypeOf(alerts).toBeAny()

          // @ts-expect-error A typed `createSelector` currently only infers
          // the parameter types of the result function when
          // input selectors are provided as a single array.
          return todos.map(({ id }) => id)
        },
      )
    })

    test('can annotate parameter types of the result function to workaround type inference issue', () => {
      createAppSelector(
        state => state.todos,
        (todos: Todo[]) => todos.map(({ id }) => id),
      )
    })
  })
})
