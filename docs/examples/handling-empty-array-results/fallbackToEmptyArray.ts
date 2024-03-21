import { createSelector } from 'reselect'
import type { RootState } from './firstPattern'

const EMPTY_ARRAY: [] = []

export const fallbackToEmptyArray = <T>(array: T[]) => {
  return array.length === 0 ? EMPTY_ARRAY : array
}

const selectCompletedTodos = createSelector(
  [(state: RootState) => state.todos],
  todos => {
    return fallbackToEmptyArray(todos.filter(todo => todo.completed === true))
  },
)
