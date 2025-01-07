import { createSelector } from 'reselect'
import { expect, test } from 'vitest'

interface RootState {
  todos: { id: number; completed: boolean }[]
  alerts: { id: number; read: boolean }[]
}

const state: RootState = {
  todos: [
    { id: 0, completed: false },
    { id: 1, completed: true },
  ],
  alerts: [
    { id: 0, read: false },
    { id: 1, read: true },
  ],
}

// With `Vitest` or `Jest`
test('selector unit test', () => {
  const selectTodoIds = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(({ id }) => id),
  )
  const firstResult = selectTodoIds(state)
  const secondResult = selectTodoIds(state)
  // Reference equality should pass.
  expect(firstResult).toBe(secondResult)
  // Deep equality should also pass.
  expect(firstResult).toStrictEqual(secondResult)
  selectTodoIds(state)
  selectTodoIds(state)
  selectTodoIds(state)
  // The result function should not recalculate.
  expect(selectTodoIds.recomputations()).toBe(1)
  // input selectors should not recalculate.
  expect(selectTodoIds.dependencyRecomputations()).toBe(1)
})

// With `Chai`
test('selector unit test', () => {
  const selectTodoIds = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(({ id }) => id),
  )
  const firstResult = selectTodoIds(state)
  const secondResult = selectTodoIds(state)
  // Reference equality should pass.
  expect(firstResult).to.equal(secondResult)
  // Deep equality should also pass.
  expect(firstResult).to.deep.equal(secondResult)
  selectTodoIds(state)
  selectTodoIds(state)
  selectTodoIds(state)
  // The result function should not recalculate.
  expect(selectTodoIds.recomputations()).to.equal(1)
  // input selectors should not recalculate.
  expect(selectTodoIds.dependencyRecomputations()).to.equal(1)
})
