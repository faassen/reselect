import { createSelector, createStructuredSelector } from 'reselect'

export interface RootState {
  todos: {
    id: number
    completed: boolean
    title: string
    description: string
  }[]
  alerts: { id: number; read: boolean }[]
}

// This:
export const structuredSelector = createStructuredSelector(
  {
    todos: (state: RootState) => state.todos,
    alerts: (state: RootState) => state.alerts,
    todoById: (state: RootState, id: number) => state.todos[id],
  },
  createSelector,
)

// Is essentially the same as this:
export const selector = createSelector(
  [
    (state: RootState) => state.todos,
    (state: RootState) => state.alerts,
    (state: RootState, id: number) => state.todos[id],
  ],
  (todos, alerts, todoById) => {
    return {
      todos,
      alerts,
      todoById,
    }
  },
)
