import { createSelector, unstable_autotrackMemoize } from 'reselect'

export interface RootState {
  todos: { id: number; completed: boolean }[]
  alerts: { id: number; read: boolean }[]
}

const selectTodoIds = createSelector(
  [(state: RootState) => state.todos],
  todos => todos.map(todo => todo.id),
  { memoize: unstable_autotrackMemoize },
)
