import { createSelector } from 'reselect'

export interface RootState {
  items: { id: number; category: string; name: string }[]
}

const state: RootState = {
  items: [
    { id: 1, category: 'Electronics', name: 'Wireless Headphones' },
    { id: 2, category: 'Books', name: 'The Great Gatsby' },
    { id: 3, category: 'Home Appliances', name: 'Blender' },
    { id: 4, category: 'Stationery', name: 'Sticky Notes' },
  ],
}

const selectItemsByCategory = createSelector(
  [
    (state: RootState) => state.items,
    (state: RootState, category: string) => category,
  ],
  (items, category) => items.filter(item => item.category === category),
)

selectItemsByCategory(state, 'Electronics') // Selector runs
selectItemsByCategory(state, 'Electronics')
selectItemsByCategory(state, 'Stationery') // Selector runs
selectItemsByCategory(state, 'Electronics') // Selector runs again!
