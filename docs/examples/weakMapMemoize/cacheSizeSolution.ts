import { createSelector } from 'reselect'
import type { RootState } from './cacheSizeProblem'

const state: RootState = {
  items: [
    { id: 1, category: 'Electronics', name: 'Wireless Headphones' },
    { id: 2, category: 'Books', name: 'The Great Gatsby' },
    { id: 3, category: 'Home Appliances', name: 'Blender' },
    { id: 4, category: 'Stationery', name: 'Sticky Notes' }
  ]
}

// `createSelector` uses `weakMapMemoize` by default.
const selectItemsByCategory = createSelector(
  [
    (state: RootState) => state.items,
    (state: RootState, category: string) => category
  ],
  (items, category) => items.filter(item => item.category === category)
)

selectItemsByCategory(state, 'Electronics') // Selector runs
selectItemsByCategory(state, 'Electronics') // Cached
selectItemsByCategory(state, 'Stationery') // Selector runs
selectItemsByCategory(state, 'Electronics') // Still cached!
