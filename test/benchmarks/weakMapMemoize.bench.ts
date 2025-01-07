import type { OutputSelector, Selector } from 'reselect'
import {
  unstable_autotrackMemoize as autotrackMemoize,
  createSelector,
  lruMemoize,
  weakMapMemoize,
} from 'reselect'
import { bench } from 'vitest'
import type { RootState } from '../testUtils'
import {
  logSelectorRecomputations,
  resetSelector,
  setFunctionNames,
  setupStore,
} from '../testUtils'

import type { Options } from 'tinybench'

describe('Parametric selectors: weakMapMemoize vs others', () => {
  const store = setupStore()
  const state = store.getState()
  const arrayOfNumbers = Array.from({ length: 30 }, (num, index) => index)
  const commonOptions: Options = {
    iterations: 10,
    time: 0,
  }
  const runSelector = <S extends Selector>(selector: S) => {
    arrayOfNumbers.forEach(num => {
      selector(state, num)
    })
    arrayOfNumbers.forEach(num => {
      selector(state, num)
    })
  }
  const selectorDefault = createSelector(
    [(state: RootState) => state.todos, (state: RootState, id: number) => id],
    (todos, id) => todos.find(todo => todo.id === id),
  )
  const selectorDefaultWithCacheSize = createSelector(
    [(state: RootState) => state.todos, (state: RootState, id: number) => id],
    (todos, id) => todos.find(todo => todo.id === id),
    { memoize: lruMemoize, memoizeOptions: { maxSize: 30 } },
  )
  const selectorDefaultWithArgsCacheSize = createSelector(
    [(state: RootState) => state.todos, (state: RootState, id: number) => id],
    (todos, id) => todos.find(todo => todo.id === id),
    {
      memoize: lruMemoize,
      argsMemoize: lruMemoize,
      argsMemoizeOptions: { maxSize: 30 },
    },
  )
  const selectorDefaultWithBothCacheSize = createSelector(
    [(state: RootState) => state.todos, (state: RootState, id: number) => id],
    (todos, id) => todos.find(todo => todo.id === id),
    {
      memoize: lruMemoize,
      argsMemoize: lruMemoize,
      memoizeOptions: { maxSize: 30 },
      argsMemoizeOptions: { maxSize: 30 },
    },
  )
  const selectorWeakMap = createSelector(
    [(state: RootState) => state.todos, (state: RootState, id: number) => id],
    (todos, id) => todos.find(todo => todo.id === id),
    { memoize: weakMapMemoize },
  )
  const selectorAutotrack = createSelector(
    (state: RootState) => state.todos,
    (state: RootState, id: number) => id,
    (todos, id) => todos.find(todo => todo.id === id),
    { memoize: autotrackMemoize },
  )
  const selectorArgsAutotrack = createSelector(
    (state: RootState) => state.todos,
    (state: RootState, id: number) => id,
    (todos, id) => todos.find(todo => todo.id === id),
    { argsMemoize: autotrackMemoize },
  )
  const selectorBothAutotrack = createSelector(
    (state: RootState) => state.todos,
    (state: RootState, id: number) => id,
    (todos, id) => todos.find(todo => todo.id === id),
    { argsMemoize: autotrackMemoize, memoize: autotrackMemoize },
  )
  const selectorArgsWeakMap = createSelector(
    (state: RootState) => state.todos,
    (state: RootState, id: number) => id,
    (todos, id) => todos.find(todo => todo.id === id),
    { argsMemoize: weakMapMemoize },
  )
  const selectorBothWeakMap = createSelector(
    (state: RootState) => state.todos,
    (state: RootState, id: number) => id,
    (todos, id) => todos.find(todo => todo.id === id),
    { argsMemoize: weakMapMemoize, memoize: weakMapMemoize },
  )
  const nonMemoizedSelector = (state: RootState, id: number) => {
    return state.todos.find(todo => todo.id === id)
  }
  setFunctionNames({
    selectorDefault,
    selectorDefaultWithCacheSize,
    selectorDefaultWithArgsCacheSize,
    selectorDefaultWithBothCacheSize,
    selectorWeakMap,
    selectorArgsWeakMap,
    selectorBothWeakMap,
    selectorAutotrack,
    selectorArgsAutotrack,
    selectorBothAutotrack,
    nonMemoizedSelector,
  })

  const createOptions = <S extends OutputSelector>(
    selector: S,
    commonOptions: Options = {},
  ) => {
    const options: Options = {
      setup: (task, mode) => {
        if (mode === 'warmup') return
        resetSelector(selector)
        task.opts = {
          afterAll: () => {
            logSelectorRecomputations(selector)
          },
        }
      },
    }
    return { ...commonOptions, ...options }
  }
  bench(
    selectorDefault,
    () => {
      runSelector(selectorDefault)
    },
    createOptions(selectorDefault, commonOptions),
  )
  bench(
    selectorDefaultWithCacheSize,
    () => {
      runSelector(selectorDefaultWithCacheSize)
    },
    createOptions(selectorDefaultWithCacheSize, commonOptions),
  )
  bench(
    selectorDefaultWithArgsCacheSize,
    () => {
      runSelector(selectorDefaultWithArgsCacheSize)
    },
    createOptions(selectorDefaultWithArgsCacheSize, commonOptions),
  )
  bench(
    selectorDefaultWithBothCacheSize,
    () => {
      runSelector(selectorDefaultWithBothCacheSize)
    },
    createOptions(selectorDefaultWithBothCacheSize, commonOptions),
  )
  bench(
    selectorWeakMap,
    () => {
      runSelector(selectorWeakMap)
    },
    createOptions(selectorWeakMap, commonOptions),
  )
  bench(
    selectorArgsWeakMap,
    () => {
      runSelector(selectorArgsWeakMap)
    },
    createOptions(selectorArgsWeakMap, commonOptions),
  )
  bench(
    selectorBothWeakMap,
    () => {
      runSelector(selectorBothWeakMap)
    },
    createOptions(selectorBothWeakMap, commonOptions),
  )
  bench(
    selectorAutotrack,
    () => {
      runSelector(selectorAutotrack)
    },
    createOptions(selectorAutotrack, commonOptions),
  )
  bench(
    selectorArgsAutotrack,
    () => {
      runSelector(selectorArgsAutotrack)
    },
    createOptions(selectorArgsAutotrack, commonOptions),
  )
  bench(
    selectorBothAutotrack,
    () => {
      runSelector(selectorBothAutotrack)
    },
    createOptions(selectorBothAutotrack, commonOptions),
  )
  bench(
    nonMemoizedSelector,
    () => {
      runSelector(nonMemoizedSelector)
    },
    { ...commonOptions },
  )
})

// describe('weakMapMemoize vs lruMemoize with maxSize', () => {
//   const store = setupStore()
//   const state = store.getState()
//   const arrayOfNumbers = Array.from({ length: 30 }, (num, index) => index)
//   const commonOptions: Options = {
//     iterations: 10,
//     time: 0
//   }
//   const runSelector = <S extends Selector>(selector: S) => {
//     arrayOfNumbers.forEach(num => {
//       selector(state, num)
//     })
//     arrayOfNumbers.forEach(num => {
//       selector(state, num)
//     })
//   }
//   const selectorDefaultWithCacheSize = createSelector(
//     [(state: RootState) => state.todos, (state: RootState, id: number) => id],
//     (todos, id) => todos.map(todo => todo.id === id),
//     { memoizeOptions: { maxSize: 30 } }
//   )
//   const selectorDefaultWithArgsCacheSize = createSelector(
//     [(state: RootState) => state.todos, (state: RootState, id: number) => id],
//     (todos, id) => todos.map(todo => todo.id === id),
//     { argsMemoizeOptions: { maxSize: 30 } }
//   )
//   const selectorDefaultWithBothCacheSize = createSelector(
//     [(state: RootState) => state.todos, (state: RootState, id: number) => id],
//     (todos, id) => todos.map(todo => todo.id === id),
//     { memoizeOptions: { maxSize: 30 }, argsMemoizeOptions: { maxSize: 30 } }
//   )
//   const selectorWeakMap = createSelector(
//     [(state: RootState) => state.todos, (state: RootState, id: number) => id],
//     (todos, id) => todos.map(todo => todo.id === id),
//     { memoize: weakMapMemoize }
//   )
//   const selectorArgsWeakMap = createSelector(
//     (state: RootState) => state.todos,
//     (state: RootState, id: number) => id,
//     (todos, id) => todos.map(todo => todo.id === id),
//     { argsMemoize: weakMapMemoize }
//   )
//   const selectorBothWeakMap = createSelector(
//     (state: RootState) => state.todos,
//     (state: RootState, id: number) => id,
//     (todos, id) => todos.map(todo => todo.id === id),
//     { argsMemoize: weakMapMemoize, memoize: weakMapMemoize }
//   )
//   const nonMemoizedSelector = (state: RootState, id: number) => {
//     return state.todos.map(todo => todo.id === id)
//   }
//   setFunctionNames({
//     selectorDefaultWithCacheSize,
//     selectorDefaultWithArgsCacheSize,
//     selectorDefaultWithBothCacheSize,
//     selectorWeakMap,
//     selectorArgsWeakMap,
//     selectorBothWeakMap,
//     nonMemoizedSelector
//   })
//   const createOptions = <S extends OutputSelector>(
//     selector: S,
//     commonOptions: Options = {}
//   ) => {
//     const options: Options = {
//       setup: (task, mode) => {
//         if (mode === 'warmup') return
//         resetSelector(selector)
//         task.opts = {
//           afterAll: () => {
//             logSelectorRecomputations(selector)
//           }
//         }
//       }
//     }
//     return { ...commonOptions, ...options }
//   }
//   bench(
//     selectorDefaultWithCacheSize,
//     () => {
//       runSelector(selectorDefaultWithCacheSize)
//     },
//     createOptions(selectorDefaultWithCacheSize, commonOptions)
//   )
//   bench(
//     selectorDefaultWithArgsCacheSize,
//     () => {
//       runSelector(selectorDefaultWithArgsCacheSize)
//     },
//     createOptions(selectorDefaultWithArgsCacheSize, commonOptions)
//   )
//   bench(
//     selectorDefaultWithBothCacheSize,
//     () => {
//       runSelector(selectorDefaultWithBothCacheSize)
//     },
//     createOptions(selectorDefaultWithBothCacheSize, commonOptions)
//   )
//   bench(
//     selectorWeakMap,
//     () => {
//       runSelector(selectorWeakMap)
//     },
//     createOptions(selectorWeakMap, commonOptions)
//   )
//   bench(
//     selectorArgsWeakMap,
//     () => {
//       runSelector(selectorArgsWeakMap)
//     },
//     createOptions(selectorArgsWeakMap, commonOptions)
//   )
//   bench(
//     selectorBothWeakMap,
//     () => {
//       runSelector(selectorBothWeakMap)
//     },
//     createOptions(selectorBothWeakMap, commonOptions)
//   )
//   bench(
//     nonMemoizedSelector,
//     () => {
//       runSelector(nonMemoizedSelector)
//     },
//     { ...commonOptions }
//   )
// })

describe('Simple selectors: weakMapMemoize vs others', () => {
  const store = setupStore()
  const commonOptions: Options = {
    // warmupIterations: 0,
    // warmupTime: 0,
    // iterations: 10,
    // time: 0
  }
  const selectTodoIdsDefault = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(({ id }) => id),
  )
  const selectTodoIdsWeakMap = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(({ id }) => id),
    { argsMemoize: weakMapMemoize },
  )
  const selectTodoIdsAutotrack = createSelector(
    [(state: RootState) => state.todos],
    todos => todos.map(({ id }) => id),
    { memoize: autotrackMemoize },
  )

  setFunctionNames({
    selectTodoIdsDefault,
    selectTodoIdsWeakMap,
    selectTodoIdsAutotrack,
  })

  const createOptions = <S extends OutputSelector>(selector: S) => {
    const options: Options = {
      setup: (task, mode) => {
        if (mode === 'warmup') return
        resetSelector(selector)
        task.opts = {
          afterAll: () => {
            logSelectorRecomputations(selector)
          },
        }
      },
    }
    return { ...commonOptions, ...options }
  }

  bench(
    selectTodoIdsDefault,
    () => {
      selectTodoIdsDefault(store.getState())
    },
    createOptions(selectTodoIdsDefault),
  )
  bench(
    selectTodoIdsWeakMap,
    () => {
      selectTodoIdsWeakMap(store.getState())
    },
    createOptions(selectTodoIdsWeakMap),
  )
  bench(
    selectTodoIdsAutotrack,
    () => {
      selectTodoIdsAutotrack(store.getState())
    },
    createOptions(selectTodoIdsAutotrack),
  )
})

describe.skip('weakMapMemoize memory leak', () => {
  const store = setupStore()
  const state = store.getState()
  const arrayOfNumbers = Array.from(
    { length: 2_000_000 },
    (num, index) => index,
  )
  const commonOptions: Options = {
    warmupIterations: 0,
    warmupTime: 0,
    iterations: 1,
    time: 0,
  }
  const runSelector = <S extends Selector>(selector: S) => {
    arrayOfNumbers.forEach(num => {
      selector(state, num)
    })
    arrayOfNumbers.forEach(num => {
      selector(state, num)
    })
  }
  const selectorDefault = createSelector(
    [(state: RootState) => state.todos, (state: RootState, id: number) => id],
    todos => todos.map(({ id }) => id),
  )
  const selectorWeakMap = createSelector(
    [(state: RootState) => state.todos, (state: RootState, id: number) => id],
    todos => todos.map(({ id }) => id),
    { memoize: weakMapMemoize },
  )
  const selectorArgsWeakMap = createSelector(
    [(state: RootState) => state.todos, (state: RootState, id: number) => id],
    todos => todos.map(({ id }) => id),
    { argsMemoize: weakMapMemoize },
  )
  const selectorBothWeakMap = createSelector(
    [(state: RootState) => state.todos, (state: RootState, id: number) => id],
    todos => todos.map(({ id }) => id),
    { argsMemoize: weakMapMemoize, memoize: weakMapMemoize },
  )
  setFunctionNames({
    selectorDefault,
    selectorWeakMap,
    selectorArgsWeakMap,
    selectorBothWeakMap,
  })
  const createOptions = <S extends OutputSelector>(
    selector: S,
    commonOptions: Options = {},
  ) => {
    const options: Options = {
      setup: (task, mode) => {
        if (mode === 'warmup') return
        task.opts = {
          afterAll: () => {
            logSelectorRecomputations(selector)
          },
        }
      },
    }
    return { ...commonOptions, ...options }
  }
  bench(
    selectorDefault,
    () => {
      runSelector(selectorDefault)
    },
    createOptions(selectorDefault, commonOptions),
  )
  bench(
    selectorWeakMap,
    () => {
      runSelector(selectorWeakMap)
    },
    createOptions(selectorWeakMap, commonOptions),
  )
  bench.skip(
    selectorArgsWeakMap,
    () => {
      runSelector(selectorArgsWeakMap)
    },
    createOptions(selectorArgsWeakMap, commonOptions),
  )
  bench.skip(
    selectorBothWeakMap,
    () => {
      runSelector(selectorBothWeakMap)
    },
    createOptions(selectorBothWeakMap, commonOptions),
  )
})
