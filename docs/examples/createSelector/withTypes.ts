import { createSelector } from 'reselect'

export interface RootState {
  todos: { id: number; completed: boolean }[]
  alerts: { id: number; read: boolean }[]
}

export const createAppSelector = createSelector.withTypes<RootState>()

const selectTodoIds = createAppSelector(
  [
    // Type of `state` is set to `RootState`, no need to manually set the type
    // highlight-start
    state => state.todos,
    // highlight-end
  ],
  todos => todos.map(({ id }) => id),
)
