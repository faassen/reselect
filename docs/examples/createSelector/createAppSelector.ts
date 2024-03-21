import microMemoize from 'micro-memoize'
import { shallowEqual } from 'react-redux'
import { createSelectorCreator, lruMemoize } from 'reselect'

export interface RootState {
  todos: { id: number; completed: boolean }[]
  alerts: { id: number; read: boolean }[]
}

export const createAppSelector = createSelectorCreator({
  memoize: lruMemoize,
  argsMemoize: microMemoize,
  memoizeOptions: {
    maxSize: 10,
    equalityCheck: shallowEqual,
    resultEqualityCheck: shallowEqual,
  },
  argsMemoizeOptions: {
    isEqual: shallowEqual,
    maxSize: 10,
  },
  devModeChecks: {
    identityFunctionCheck: 'never',
    inputStabilityCheck: 'always',
  },
}).withTypes<RootState>()

const selectReadAlerts = createAppSelector(
  [
    // Type of `state` is set to `RootState`, no need to manually set the type
    // highlight-start
    state => state.alerts,
    // highlight-end
  ],
  alerts => alerts.filter(({ read }) => read),
)
