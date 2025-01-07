import { createSelector } from 'reselect'

interface Todo {
  id: number
  completed: boolean
}

interface Alert {
  id: number
  read: boolean
}

export interface RootState {
  todos: Todo[]
  alerts: Alert[]
}

export const createAppSelector = createSelector.withTypes<RootState>()

const selectTodoIds = createAppSelector(
  // Type of `state` is set to `RootState`, no need to manually set the type
  state => state.todos,
  // ❌ Known limitation: Parameter types are not inferred in this scenario
  // so you will have to manually annotate them.
  // highlight-start
  (todos: Todo[]) => todos.map(({ id }) => id),
  // highlight-end
)
