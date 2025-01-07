import { createSelectorCreator, unstable_autotrackMemoize } from 'reselect'
import type { RootState } from './usingWithCreateSelector'

const createSelectorAutotrack = createSelectorCreator({
  memoize: unstable_autotrackMemoize,
})

const selectTodoIds = createSelectorAutotrack(
  [(state: RootState) => state.todos],
  todos => todos.map(todo => todo.id),
)
