/**
 * @vitest-environment jsdom
 */

import * as rtl from '@testing-library/react'
import React, { useLayoutEffect, useMemo } from 'react'
import type { TypedUseSelectorHook } from 'react-redux'
import { Provider, shallowEqual, useSelector } from 'react-redux'
import {
  createSelector,
  lruMemoize,
  unstable_autotrackMemoize,
  weakMapMemoize,
} from 'reselect'

import type { OutputSelector } from 'reselect'
import type { RootState, Todo } from './testUtils'
import { addTodo, setupStore, toggleCompleted } from './testUtils'

describe('Computations and re-rendering with React components', () => {
  const selector = createSelector(
    (a: number) => a,
    a => a,
  )

  test('passes', () => {
    console.log(selector(1))
  })

  let store: ReturnType<typeof setupStore>

  beforeEach(() => {
    store = setupStore()
    listItemRenders = 0
    listRenders = 0
    listItemMounts = 0
  })

  type SelectTodoIds = OutputSelector<
    [(state: RootState) => RootState['todos']],
    number[],
    typeof lruMemoize | typeof weakMapMemoize,
    typeof lruMemoize | typeof weakMapMemoize
  >

  type SelectTodoById = OutputSelector<
    [
      (state: RootState) => RootState['todos'],
      (state: RootState, id: number) => number,
    ],
    readonly [todo: Todo | undefined],
    typeof lruMemoize | typeof weakMapMemoize,
    typeof lruMemoize | typeof weakMapMemoize
  >

  const selectTodos = (state: RootState) => state.todos
  const mapTodoIds = (todos: RootState['todos']) => todos.map(({ id }) => id)
  const selectTodoId = (todos: RootState, id: number) => id
  const mapTodoById = (todos: RootState['todos'], id: number) => {
    // Intentionally return this wrapped in an array to force a new reference each time
    return [todos.find(todo => todo.id === id)] as const
  }

  const selectTodoIdsDefault = createSelector([selectTodos], mapTodoIds)
  console.log(`selectTodoIdsDefault name: ${selectTodoIdsDefault.name}`)

  const selectTodoIdsResultEquality = createSelector(
    [selectTodos],
    mapTodoIds,
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
  )

  const selectTodoIdsWeakMap = createSelector([selectTodos], mapTodoIds, {
    argsMemoize: weakMapMemoize,
    memoize: weakMapMemoize,
  })

  const selectTodoIdsWeakMapResultEquality = createSelector(
    [selectTodos],
    mapTodoIds,
    {
      argsMemoize: weakMapMemoize,
      memoize: weakMapMemoize,
      memoizeOptions: { resultEqualityCheck: shallowEqual },
    },
  )

  const selectTodoByIdDefault = createSelector(
    [selectTodos, selectTodoId],
    mapTodoById,
  )

  const selectTodoByIdResultEquality = createSelector(
    [selectTodos, selectTodoId],
    mapTodoById,
    {
      memoize: lruMemoize,
      memoizeOptions: { resultEqualityCheck: shallowEqual, maxSize: 500 },
    },
  )

  const selectTodoByIdWeakMap = createSelector(
    [selectTodos, selectTodoId],
    mapTodoById,
    { argsMemoize: weakMapMemoize, memoize: weakMapMemoize },
  )

  const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

  let listItemRenders = 0
  let listRenders = 0
  let listItemMounts = 0

  const TodoListItem = React.memo(function TodoListItem({
    id,
    selectTodoById,
  }: {
    id: number
    selectTodoById: SelectTodoById
  }) {
    // Prevent `useSelector` from re-running the selector while rendering
    // due to passing in a new selector reference
    const memoizedSelectTodoById = useMemo(
      () => (state: RootState) => selectTodoById(state, id),
      [id],
    )
    const [todo] = useAppSelector(memoizedSelectTodoById)

    useLayoutEffect(() => {
      listItemRenders++
    })

    useLayoutEffect(() => {
      listItemMounts++
    }, [])

    return <li>{todo?.title}</li>
  })

  const TodoList = ({
    selectTodoIds,
    selectTodoById,
  }: {
    selectTodoIds: SelectTodoIds
    selectTodoById: SelectTodoById
  }) => {
    const todoIds = useAppSelector(selectTodoIds)

    useLayoutEffect(() => {
      listRenders++
    })

    return (
      <ul>
        {todoIds.map(id => (
          <TodoListItem key={id} id={id} selectTodoById={selectTodoById} />
        ))}
      </ul>
    )
  }

  const testCases: [string, SelectTodoIds, SelectTodoById][] = [
    ['default', selectTodoIdsDefault, selectTodoByIdDefault],
    [
      'resultEquality',
      selectTodoIdsResultEquality,
      selectTodoByIdResultEquality,
    ],
    ['weakMap', selectTodoIdsWeakMap, selectTodoByIdWeakMap],

    [
      'weakMapResultEquality',
      selectTodoIdsWeakMapResultEquality,
      selectTodoByIdWeakMap,
    ],
  ]

  test.each(testCases)(`%s`, async (name, selectTodoIds, selectTodoById) => {
    selectTodoIds.resetRecomputations()
    selectTodoIds.resetDependencyRecomputations()
    selectTodoById.resetRecomputations()
    selectTodoById.resetDependencyRecomputations()
    selectTodoIds.memoizedResultFunc.resetResultsCount()
    selectTodoById.memoizedResultFunc.resetResultsCount()

    const numTodos = store.getState().todos.length
    rtl.render(
      <Provider store={store}>
        <TodoList
          selectTodoIds={selectTodoIds}
          selectTodoById={selectTodoById}
        />
      </Provider>,
    )

    // console.log(`Recomputations after render (${name}): `)
    // console.log('selectTodoIds: ')
    // logSelectorRecomputations(selectTodoIds as any)
    // console.log('selectTodoById: ')
    // logSelectorRecomputations(selectTodoById as any)

    // console.log('Render count: ', {
    //   listRenders,
    //   listItemRenders,
    //   listItemMounts
    // })

    expect(listItemRenders).toBe(numTodos)

    rtl.act(() => {
      store.dispatch(toggleCompleted(3))
    })

    // console.log(`\nRecomputations after toggle completed (${name}): `)
    // console.log('selectTodoIds: ')
    // logSelectorRecomputations(selectTodoIds as any)
    // console.log('selectTodoById: ')
    // logSelectorRecomputations(selectTodoById as any)

    // console.log('Render count: ', {
    //   listRenders,
    //   listItemRenders,
    //   listItemMounts
    // })

    rtl.act(() => {
      store.dispatch(addTodo({ title: 'a', description: 'b' }))
    })

    // console.log(`\nRecomputations after added (${name}): `)
    // console.log('selectTodoIds: ')
    // // logSelectorRecomputations(selectTodoIds as any)
    // console.log('selectTodoById: ')
    // // logSelectorRecomputations(selectTodoById as any)

    // console.log('Render count: ', {
    //   listRenders,
    //   listItemRenders,
    //   listItemMounts
    // })
  })
})

describe('resultEqualityCheck in weakMapMemoize', () => {
  test('resultEqualityCheck with shallowEqual', () => {
    const store = setupStore()
    const state = store.getState()
    const selectorWeakMap = createSelector(
      [(state: RootState) => state.todos],
      todos => todos.map(({ id }) => id),
      { memoize: weakMapMemoize },
    )
    const selectorWeakMapShallow = createSelector(
      [(state: RootState) => state.todos],
      todos => todos.map(({ id }) => id),
      {
        memoize: weakMapMemoize,
        memoizeOptions: { resultEqualityCheck: shallowEqual },
      },
    )
    const selectorAutotrack = createSelector(
      [(state: RootState) => state.todos],
      todos => todos.map(({ id }) => id),
      { memoize: unstable_autotrackMemoize },
    )
    const firstResult = selectorWeakMap(store.getState())
    store.dispatch(toggleCompleted(0))
    const secondResult = selectorWeakMap(store.getState())
    expect(firstResult).not.toBe(secondResult)
    expect(firstResult).toStrictEqual(secondResult)
    const firstResultShallow = selectorWeakMapShallow(store.getState())
    store.dispatch(toggleCompleted(0))
    const secondResultShallow = selectorWeakMapShallow(store.getState())
    expect(firstResultShallow).toBe(secondResultShallow)
    const firstResultAutotrack = selectorAutotrack(store.getState())
    store.dispatch(toggleCompleted(0))
    const secondResultAutotrack = selectorAutotrack(store.getState())
    expect(firstResultAutotrack).toBe(secondResultAutotrack)

    const memoized = weakMapMemoize((state: RootState) =>
      state.todos.map(({ id }) => id),
    )
    const memoizedShallow = weakMapMemoize(
      (state: RootState) => state.todos.map(({ id }) => id),
      { resultEqualityCheck: shallowEqual },
    )
    expect(memoized.resetResultsCount).to.be.a('function')
    expect(memoized.resultsCount).to.be.a('function')
    expect(memoized.clearCache).to.be.a('function')

    expect(memoizedShallow.resetResultsCount).to.be.a('function')
    expect(memoizedShallow.resultsCount).to.be.a('function')
    expect(memoizedShallow.clearCache).to.be.a('function')

    expect(memoized(state)).toBe(memoized(state))
    expect(memoized(state)).toBe(memoized(state))
    expect(memoized(state)).toBe(memoized(state))
    expect(memoized.resultsCount()).toBe(1)
    expect(memoized({ ...state })).not.toBe(memoized(state))
    expect(memoized({ ...state })).toStrictEqual(memoized(state))
    expect(memoized.resultsCount()).toBe(3)
    expect(memoized({ ...state })).not.toBe(memoized(state))
    expect(memoized({ ...state })).toStrictEqual(memoized(state))
    expect(memoized.resultsCount()).toBe(5)

    expect(memoizedShallow(state)).toBe(memoizedShallow(state))
    expect(memoizedShallow.resultsCount()).toBe(1)
    expect(memoizedShallow({ ...state })).toBe(memoizedShallow(state))
    expect(memoizedShallow.resultsCount()).toBe(1)
    expect(memoizedShallow({ ...state })).toBe(memoizedShallow(state))
    // We spread the state to force the function to re-run but the
    // result maintains the same reference because of `resultEqualityCheck`.
    const first = memoizedShallow({ ...state })
    expect(memoizedShallow.resultsCount()).toBe(1)
    memoizedShallow({ ...state })
    expect(memoizedShallow.resultsCount()).toBe(1)
    const second = memoizedShallow({ ...state })
    expect(memoizedShallow.resultsCount()).toBe(1)
    expect(first).toBe(second)
  })
})
