import { createSelector } from 'reselect'

export interface RootState {
  todos: {
    id: number
    title: string
    description: string
    completed: boolean
  }[]
}

const EMPTY_ARRAY: [] = []

const selectCompletedTodos = createSelector(
  [(state: RootState) => state.todos],
  todos => {
    const completedTodos = todos.filter(todo => todo.completed === true)
    return completedTodos.length === 0 ? EMPTY_ARRAY : completedTodos
  },
)
