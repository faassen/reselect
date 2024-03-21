import {
  createSelector,
  createSelectorCreator,
  createStructuredSelector,
  lruMemoize,
} from 'reselect'
import type { LocalTestContext, RootState } from './testUtils'
import { setupStore } from './testUtils'

interface StateAB {
  a: number
  b: number
}

describe(createStructuredSelector, () => {
  test('structured selector', () => {
    const selector = createStructuredSelector({
      x: (state: StateAB) => state.a,
      y: (state: StateAB) => state.b,
    })
    const firstResult = selector({ a: 1, b: 2 })
    expect(firstResult).toEqual({ x: 1, y: 2 })
    expect(selector({ a: 1, b: 2 })).toBe(firstResult)
    const secondResult = selector({ a: 2, b: 2 })
    expect(secondResult).toEqual({ x: 2, y: 2 })
    expect(selector({ a: 2, b: 2 })).toBe(secondResult)
  })

  test('structured selector with invalid arguments', () => {
    expect(() =>
      createStructuredSelector(
        // @ts-expect-error
        (state: StateAB) => state.a,
        (state: StateAB) => state.b,
      ),
    ).toThrow(/expects first argument to be an object.*function/)
    expect(() =>
      createStructuredSelector({
        a: state => state.b,
        // @ts-expect-error
        c: 'd',
      }),
    ).toThrow(
      'createSelector expects all input-selectors to be functions, but received the following types: [function a(), string]',
    )
  })

  test('structured selector with custom selector creator', () => {
    const customSelectorCreator = createSelectorCreator(
      lruMemoize,
      (a, b) => a === b,
    )
    const selector = createStructuredSelector(
      {
        x: (state: StateAB) => state.a,
        y: (state: StateAB) => state.b,
      },
      customSelectorCreator,
    )
    const firstResult = selector({ a: 1, b: 2 })
    expect(firstResult).toEqual({ x: 1, y: 2 })
    expect(selector({ a: 1, b: 2 })).toBe(firstResult)
    expect(selector({ a: 2, b: 2 })).toEqual({ x: 2, y: 2 })
  })
})

describe<LocalTestContext>('structured selector created with createStructuredSelector', localTest => {
  beforeEach<LocalTestContext>(context => {
    const store = setupStore()
    context.store = store
    context.state = store.getState()
  })
  localTest(
    'structured selector created with createStructuredSelector and createSelector are the same',
    ({ state }) => {
      const structuredSelector = createStructuredSelector(
        {
          allTodos: (state: RootState) => state.todos,
          allAlerts: (state: RootState) => state.alerts,
          selectedTodo: (state: RootState, id: number) => state.todos[id],
        },
        createSelector,
      )
      const selector = createSelector(
        [
          (state: RootState) => state.todos,
          (state: RootState) => state.alerts,
          (state: RootState, id: number) => state.todos[id],
        ],
        (allTodos, allAlerts, selectedTodo) => {
          return {
            allTodos,
            allAlerts,
            selectedTodo,
          }
        },
      )
      expect(selector(state, 1).selectedTodo.id).toBe(
        structuredSelector(state, 1).selectedTodo.id,
      )
      expect(structuredSelector.dependencies)
        .to.be.an('array')
        .with.lengthOf(selector.dependencies.length)
      expect(
        structuredSelector.resultFunc(
          state.todos,
          state.alerts,
          state.todos[0],
        ),
      ).toStrictEqual(
        selector.resultFunc(state.todos, state.alerts, state.todos[0]),
      )
      expect(
        structuredSelector.memoizedResultFunc(
          state.todos,
          state.alerts,
          state.todos[0],
        ),
      ).toStrictEqual(
        selector.memoizedResultFunc(state.todos, state.alerts, state.todos[0]),
      )
      expect(structuredSelector.argsMemoize).toBe(selector.argsMemoize)
      expect(structuredSelector.memoize).toBe(selector.memoize)
      expect(structuredSelector.recomputations()).toBe(
        selector.recomputations(),
      )
      expect(structuredSelector.lastResult()).toStrictEqual(
        selector.lastResult(),
      )
      expect(Object.keys(structuredSelector)).toStrictEqual(
        Object.keys(selector),
      )
    },
  )

  localTest(
    'structured selector invalid args can throw runtime errors',
    ({ state }) => {
      const structuredSelector = createStructuredSelector(
        {
          allTodos: (state: RootState) => state.todos,
          allAlerts: (state: RootState) => state.alerts,
          selectedTodo: (
            state: RootState,
            id: number,
            field: keyof RootState['todos'][number],
          ) => state.todos[id][field],
        },
        createSelector,
      )
      const selector = createSelector(
        [
          (state: RootState) => state.todos,
          (state: RootState) => state.alerts,
          (
            state: RootState,
            id: number,
            field: keyof RootState['todos'][number],
          ) => state.todos[id][field],
        ],
        (allTodos, allAlerts, selectedTodo) => {
          return {
            allTodos,
            allAlerts,
            selectedTodo,
          }
        },
      )
      // These two cases are the same.
      // @ts-expect-error
      expect(() => structuredSelector(state)).toThrowError(TypeError)
      // @ts-expect-error
      expect(() => selector(state)).toThrowError(TypeError)
    },
  )
})
