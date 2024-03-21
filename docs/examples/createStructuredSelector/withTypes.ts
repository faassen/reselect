import { createStructuredSelector } from 'reselect'

export interface RootState {
  todos: { id: number; completed: boolean }[]
  alerts: { id: number; read: boolean }[]
}

export const createStructuredAppSelector =
  createStructuredSelector.withTypes<RootState>()

const structuredAppSelector = createStructuredAppSelector({
  // Type of `state` is set to `RootState`, no need to manually set the type
  // highlight-start
  todos: state => state.todos,
  // highlight-end
  alerts: state => state.alerts,
  todoById: (state, id: number) => state.todos[id],
})
