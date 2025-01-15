import { createSelector, createSelectorCreator, lruMemoize } from 'reselect'

interface RootState {
  todos: {
    id: number
    completed: boolean
  }[]
}

const createAppSelector = createSelector.withTypes<RootState>()

const createSelectorLru = createSelectorCreator({
  memoize: lruMemoize,
  argsMemoize: lruMemoize
})

const createAppSelectorLru = createSelectorLru.withTypes<RootState>()

const createStateSelector = createSelectorCreator({
  memoize: lruMemoize,
  argsMemoize: lruMemoize
}).withTypes<RootState>()

const selectTodoIds = createAppSelector(
  (state) => state.todos,
  (todos) => todos.map(({ id }) => id)
)

const selectTodoIds2 = createAppSelectorLru(
  (state) => state.todos,
  (todos) => todos.map(({ id }) => id)
)

const selectTodoIds3 = createStateSelector(
  (state) => state.todos,
  (todos) => todos.map(({ id }) => id)
)

const selectTodoIdsWithOptions = createAppSelector(
  (state) => state.todos,
  (todos) => todos.map(({ id }) => id),
  {
    argsMemoize: lruMemoize,
    memoize: lruMemoize
  }
)
