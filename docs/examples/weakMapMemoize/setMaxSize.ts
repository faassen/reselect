import { createSelector, lruMemoize } from 'reselect'
import type { RootState } from './cacheSizeProblem'

const selectItemsByCategory = createSelector(
  [
    (state: RootState) => state.items,
    (state: RootState, category: string) => category,
  ],
  (items, category) => items.filter(item => item.category === category),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      maxSize: 10,
    },
  },
)
