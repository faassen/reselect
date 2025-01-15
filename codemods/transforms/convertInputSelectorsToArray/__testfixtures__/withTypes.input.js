import { createSelector, createSelectorCreator, lruMemoize } from 'reselect'

const createAppSelector = createSelector.withTypes()

const createSelectorLru = createSelectorCreator({
    memoize: lruMemoize,
    argsMemoize: lruMemoize
})

const createAppSelectorLru = createSelectorLru.withTypes()

const createStateSelector = createSelectorCreator({
    memoize: lruMemoize,
    argsMemoize: lruMemoize
}).withTypes()

const selectTodoIds = createAppSelector((state) => state.todos, (todos) => todos.map(({ id }) => id))

const selectTodoIds2 = createAppSelectorLru((state) => state.todos, (todos) => todos.map(({ id }) => id))

const selectTodoIds3 = createStateSelector((state) => state.todos, (todos) => todos.map(({ id }) => id))

const selectTodoIdsWithOptions = createAppSelector((state) => state.todos, (todos) => todos.map(({ id }) => id), {
    argsMemoize: lruMemoize,
    memoize: lruMemoize
})
