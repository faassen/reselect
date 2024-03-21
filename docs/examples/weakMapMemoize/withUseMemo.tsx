import type { FC } from 'react'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import type { RootState } from './cacheSizeProblem'

const makeSelectItemsByCategory = (category: string) =>
  createSelector([(state: RootState) => state.items], items =>
    items.filter(item => item.category === category),
  )

interface Props {
  category: string
}

const MyComponent: FC<Props> = ({ category }) => {
  const selectItemsByCategory = useMemo(
    () => makeSelectItemsByCategory(category),
    [category],
  )

  const itemsByCategory = useSelector(selectItemsByCategory)

  return (
    <div>
      {itemsByCategory.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
