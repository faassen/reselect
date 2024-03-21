import type { weakMapMemoize, SelectorArray, UnknownMemoizer } from 'reselect'
import { createSelector } from 'reselect'
import { currySelector } from './currySelector'

export const createCurriedSelector = <
  InputSelectors extends SelectorArray,
  Result,
  OverrideMemoizeFunction extends UnknownMemoizer = typeof weakMapMemoize,
  OverrideArgsMemoizeFunction extends UnknownMemoizer = typeof weakMapMemoize,
>(
  ...args: Parameters<
    typeof createSelector<
      InputSelectors,
      Result,
      OverrideMemoizeFunction,
      OverrideArgsMemoizeFunction
    >
  >
) => {
  return currySelector(createSelector(...args))
}
