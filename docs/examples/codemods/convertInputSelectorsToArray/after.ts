import { createSelector } from 'reselect'

export interface RootState {
  todos: { id: number; completed: boolean }[]
  alerts: { id: number; read: boolean }[]
}

const selectTodoById = createSelector(
  [(state: RootState) => state.todos, (state: RootState, id: number) => id],
  (todos, id) => todos.find(todo => todo.id === id)
)
