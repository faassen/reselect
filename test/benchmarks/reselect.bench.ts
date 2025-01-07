import {
  createSelector,
  unstable_autotrackMemoize as autotrackMemoize,
  weakMapMemoize,
} from 'reselect'
import type { Options } from 'tinybench'
import { bench, describe } from 'vitest'
import type { RootState } from '../testUtils'
import { setFunctionNames, setupStore } from '../testUtils'

describe('Memoize methods comparison', () => {
  const commonOptions: Options = {
    iterations: 10,
    time: 0,
  }
  const store = setupStore()
  const state = store.getState()
  const selectorDefault = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(({ id }) => id),
  )
  const selectorWeakMap = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(({ id }) => id),
    { memoize: weakMapMemoize },
  )
  const selectorAutotrack = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(({ id }) => id),
    { memoize: autotrackMemoize },
  )
  const selectorArgsWeakMap = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(({ id }) => id),
    { argsMemoize: weakMapMemoize },
  )
  const selectorArgsAutotrack = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(({ id }) => id),
    { argsMemoize: autotrackMemoize },
  )
  const selectorBothWeakMap = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(({ id }) => id),
    { argsMemoize: weakMapMemoize, memoize: weakMapMemoize },
  )
  const selectorBothAutotrack = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(({ id }) => id),
    { argsMemoize: autotrackMemoize, memoize: autotrackMemoize },
  )
  const nonMemoizedSelector = (state: RootState) => {
    return state.todos.map(({ id }) => id)
  }
  setFunctionNames({
    selectorDefault,
    selectorAutotrack,
    selectorWeakMap,
    selectorArgsAutotrack,
    nonMemoizedSelector,
    selectorArgsWeakMap,
  })
  bench(
    selectorDefault,
    () => {
      selectorDefault(state)
    },
    commonOptions,
  )
  bench(
    selectorAutotrack,
    () => {
      selectorAutotrack(state)
    },
    commonOptions,
  )
  bench(
    selectorWeakMap,
    () => {
      selectorWeakMap(state)
    },
    commonOptions,
  )
  bench(
    selectorArgsAutotrack,
    () => {
      selectorArgsAutotrack(state)
    },
    commonOptions,
  )
  bench(
    selectorArgsWeakMap,
    () => {
      selectorArgsWeakMap(state)
    },
    commonOptions,
  )
  bench(
    selectorBothWeakMap,
    () => {
      selectorBothWeakMap(state)
    },
    commonOptions,
  )
  bench(
    selectorBothAutotrack,
    () => {
      selectorBothAutotrack(state)
    },
    commonOptions,
  )
  bench(
    nonMemoizedSelector,
    () => {
      nonMemoizedSelector(state)
    },
    commonOptions,
  )
})

describe('Cached vs non-cached length in for loops', () => {
  const commonOptions: Options = {
    iterations: 10,
    time: 0,
  }
  const store = setupStore()
  const state = store.getState()
  const { todos } = state
  const { length } = todos
  bench(
    'length not cached',
    () => {
      for (let i = 0; i < todos.length; i++) {
        todos[i].completed
        todos[i].id
      }
    },
    commonOptions,
  )
  bench(
    'length cached',
    () => {
      for (let i = 0; i < length; i++) {
        todos[i].completed
        todos[i].id
      }
    },
    commonOptions,
  )
  bench(
    'length and arg cached',
    () => {
      for (let i = 0; i < length; i++) {
        const arg = todos[i]
        arg.completed
        arg.id
      }
    },
    commonOptions,
  )
})

describe.todo('nested field access', () => {
  const commonOptions: Options = {
    iterations: 10,
    time: 0,
  }
  const store = setupStore()
  const state = store.getState()
  const selectorDefault = createSelector(
    (state: RootState) => state.users,
    users => users.user.details.preferences.notifications.push.frequency,
  )
  const selectorDefault1 = createSelector(
    (state: RootState) => state.users.user,
    user => user.details.preferences.notifications.push.frequency,
  )
  const nonMemoizedSelector = (state: RootState) =>
    state.users.user.details.preferences.notifications.push.frequency
  bench(
    'selectorDefault',
    () => {
      selectorDefault(state)
    },
    commonOptions,
  )
  bench(
    'nonMemoizedSelector',
    () => {
      nonMemoizedSelector(state)
    },
    commonOptions,
  )
  bench(
    'selectorDefault1',
    () => {
      selectorDefault1(state)
    },
    commonOptions,
  )
})

describe.todo('simple field access', () => {
  const commonOptions: Options = {
    iterations: 10,
    time: 0,
  }
  const store = setupStore()
  const state = store.getState()
  const selectorDefault = createSelector(
    (state: RootState) => state.users,
    users => users.user.details.preferences.notifications.push.frequency,
  )
  const selectorDefault1 = createSelector(
    (state: RootState) => state.users.user,
    user => user.details.preferences.notifications.push.frequency,
  )
  const selectorDefault2 = createSelector(
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    (state: RootState) => state.users,
    users => users.user.details.preferences.notifications.push.frequency,
  )
  const nonMemoizedSelector = (state: RootState) =>
    state.users.user.details.preferences.notifications.push.frequency
  bench(
    'selectorDefault',
    () => {
      selectorDefault(state)
    },
    commonOptions,
  )
  bench(
    'nonMemoizedSelector',
    () => {
      nonMemoizedSelector(state)
    },
    commonOptions,
  )
  bench(
    'selectorDefault1',
    () => {
      selectorDefault1(state)
    },
    commonOptions,
  )
  bench(
    'selectorDefault2',
    () => {
      selectorDefault2(state)
    },
    commonOptions,
  )
})

describe.todo('field accessors', () => {
  const commonOptions: Options = {
    iterations: 10,
    time: 0,
  }
  const store = setupStore()
  const selectorDefault = createSelector(
    [(state: RootState) => state.users],
    users => users.appSettings,
  )
  const nonMemoizedSelector = (state: RootState) => state.users.appSettings
  setFunctionNames({ selectorDefault, nonMemoizedSelector })
  bench(
    selectorDefault,
    () => {
      selectorDefault(store.getState())
    },
    { ...commonOptions },
  )
  bench(
    nonMemoizedSelector,
    () => {
      nonMemoizedSelector(store.getState())
    },
    { ...commonOptions },
  )
})
