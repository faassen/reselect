import { createSelector } from 'reselect'
import type { RootState } from './selectorRecomputing'

export const currySelector = <
  State,
  Result,
  Params extends readonly any[],
  AdditionalFields,
>(
  selector: ((state: State, ...args: Params) => Result) & AdditionalFields,
) => {
  const curriedSelector = (...args: Params) => {
    return (state: State) => {
      return selector(state, ...args)
    }
  }
  return Object.assign(curriedSelector, selector)
}

const selectTodoByIdCurried = currySelector(
  createSelector(
    [(state: RootState) => state.todos, (state: RootState, id: number) => id],
    (todos, id) => todos.find(todo => todo.id === id),
  ),
)
