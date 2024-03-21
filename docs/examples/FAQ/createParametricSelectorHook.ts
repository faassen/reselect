import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'

interface RootState {
  todos: {
    id: number
    completed: boolean
    title: string
    description: string
  }[]
  alerts: { id: number; read: boolean }[]
}

const state: RootState = {
  todos: [
    {
      id: 0,
      completed: false,
      title: 'Figure out if plants are really plotting world domination.',
      description: 'They may be.',
    },
    {
      id: 1,
      completed: true,
      title: 'Practice telekinesis for 15 minutes',
      description: 'Just do it',
    },
  ],
  alerts: [
    { id: 0, read: false },
    { id: 1, read: true },
  ],
}

const selectTodoById = createSelector(
  [(state: RootState) => state.todos, (state: RootState, id: number) => id],
  (todos, id) => todos.find(todo => todo.id === id),
)

export const createParametricSelectorHook = <
  Result,
  Params extends readonly unknown[],
>(
  selector: (state: RootState, ...params: Params) => Result,
) => {
  return (...args: Params) => {
    return useSelector((state: RootState) => selector(state, ...args))
  }
}

export const useSelectTodo = createParametricSelectorHook(selectTodoById)
