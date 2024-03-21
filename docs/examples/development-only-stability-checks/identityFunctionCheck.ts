import { createSelector } from 'reselect'

interface RootState {
  todos: { id: number; completed: boolean }[]
  alerts: { id: number; read: boolean }[]
}

// Create a selector that checks to see if the result function is an identity function.
const selectTodos = createSelector(
  // ✔️ GOOD: Contains extraction logic.
  [(state: RootState) => state.todos],
  // ❌ BAD: Does not contain transformation logic.
  todos => todos,
  // Will override the global setting.
  { devModeChecks: { identityFunctionCheck: 'always' } },
)
