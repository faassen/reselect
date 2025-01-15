import {
  unstable_autotrackMemoize as autotrackMemoize,
  createSelector,
  createSelectorCreator,
  lruMemoize,
  weakMapMemoize
} from 'reselect'

const state = {
  todos: [
    { id: 0, completed: false },
    { id: 1, completed: false }
  ]
}

const selectorDefault = createSelector(
  (state) => state.todos,
  (todos) => todos.map((t) => t.id)
)

const selectorDefaultParametric = createSelector(
  (state, id) => id,
  (state) => state.todos,
  (id, todos) => todos.filter((t) => t.id === id)
)

const selectorLodashFunc = createSelector(
  (state) => state.todos,
  (todos) => todos.map((t) => t.id),
  {
    memoizeOptions: []
  }
)

const createSelectorWeakMap = createSelectorCreator(weakMapMemoize)

const selector1 = createSelectorWeakMap([(state) => state.todos], (todos) =>
  todos.map((t) => t.id)
)

const selector2 = createSelectorWeakMap(
  [(state, id) => id, (state) => state.todos],
  (id, todos) => todos.filter((t) => t.id === id)
)

const selector3 = createSelectorWeakMap(
  [(state, id) => id, (state) => state.todos],
  (id, todos) => todos.filter((t) => t.id === id),
  { memoizeOptions: [] }
)

const selectorDefault2 = createSelector(
  [(state) => state.todos, (state, id) => id],
  (todos, id) => todos.map((todo) => todo.id === id)
)

const selectorDefaultWithCacheSize = createSelector(
  [(state) => state.todos, (state, id) => id],
  (todos, id) => todos.map((todo) => todo.id === id),
  { memoize: lruMemoize, memoizeOptions: { maxSize: 30 } }
)

const selectorDefaultWithArgsCacheSize = createSelector(
  [(state) => state.todos, (state, id) => id],
  (todos, id) => todos.map((todo) => todo.id === id),
  { argsMemoize: lruMemoize, argsMemoizeOptions: { maxSize: 30 } }
)

const selectorDefaultWithBothCacheSize = createSelector(
  [(state) => state.todos, (state, id) => id],
  (todos, id) => todos.map((todo) => todo.id === id),
  {
    memoize: lruMemoize,
    argsMemoize: lruMemoize,
    memoizeOptions: { maxSize: 30 },
    argsMemoizeOptions: { maxSize: 30 }
  }
)

const selectorWeakMap = createSelector(
  [(state) => state.todos, (state, id) => id],
  (todos, id) => todos.map((todo) => todo.id === id),
  { memoize: weakMapMemoize }
)

const selectorAutotrack = createSelector(
  (state) => state.todos,
  (state, id) => id,
  (todos, id) => todos.map((todo) => todo.id === id),
  { memoize: autotrackMemoize }
)

const selectorArgsAutotrack = createSelector(
  (state) => state.todos,
  (state, id) => id,
  (todos, id) => todos.map((todo) => todo.id === id),
  { argsMemoize: autotrackMemoize }
)

const selectorBothAutotrack = createSelector(
  (state) => state.todos,
  (state, id) => id,
  (todos, id) => todos.map((todo) => todo.id === id),
  { argsMemoize: autotrackMemoize, memoize: autotrackMemoize }
)

const selectorArgsWeakMap = createSelector(
  (state) => state.todos,
  (state, id) => id,
  (todos, id) => todos.map((todo) => todo.id === id),
  { argsMemoize: weakMapMemoize }
)

const selectorBothWeakMap = createSelector(
  (state) => state.todos,
  (state, id) => id,
  (todos, id) => todos.map((todo) => todo.id === id),
  { argsMemoize: weakMapMemoize, memoize: weakMapMemoize }
)

const arr = [(state) => state.todos, (state, id) => id]

const selectorBothWeakMap1 = createSelector(
  arr,
  (todos, id) => todos.map((todo) => todo.id === id),
  { argsMemoize: weakMapMemoize, memoize: weakMapMemoize }
)

const arr3 = [
  function (state) {
    return state.todos
  },
  function (state, id) {
    return id
  }
]

const selectorBothWeakMap4 = createSelector(
  arr3,
  (todos, id) => todos.map((todo) => todo.id === id),
  { argsMemoize: weakMapMemoize, memoize: weakMapMemoize }
)

const selectTodoIds = createSelector(
  function selectTodos(state) {
    return state.todos
  },
  function selectId(state, id) {
    return id
  },
  (todos, id) => todos.map((todo) => todo.id)
)

const arr4 = [
  function (state) {
    return state.todos
  },
  function (state, id) {
    return id
  }
]

const selectorBothWeakMap5 = createSelector(
  arr4,
  (todos, id) => todos.map((todo) => todo.id === id),
  { argsMemoize: weakMapMemoize, memoize: weakMapMemoize }
)

const arr5 = [
  function (state) {
    return state.todos
  },
  function (state, id) {
    return id
  }
]

const selectorBothWeakMap6 = createSelector(
  arr5,
  (todos, id) => todos.map((todo) => todo.id === id),
  { argsMemoize: weakMapMemoize, memoize: weakMapMemoize }
)

const inputSelector = (state) => state.todos

const selector = createSelector(inputSelector, (todos) =>
  todos.map(({ id }) => id)
)
