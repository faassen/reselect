import type { OutputSelector, Selector } from 'reselect'
import { createSelector, lruMemoize } from 'reselect'
import type { Options } from 'tinybench'
import { bench } from 'vitest'
import type { RootState } from '../testUtils'
import {
  countRecomputations,
  expensiveComputation,
  logFunctionInfo,
  logSelectorRecomputations,
  resetSelector,
  runMultipleTimes,
  setFunctionNames,
  setupStore,
  toggleCompleted,
  toggleRead,
} from '../testUtils'

describe('Less vs more computation in input selectors', () => {
  const store = setupStore()
  const runSelector = (selector: Selector) => {
    runMultipleTimes(selector, 100, store.getState())
  }
  const selectorLessInInput = createSelector(
    [(state: RootState) => state.todos],
    todos => {
      expensiveComputation()
      return todos.filter(todo => todo.completed)
    },
  )
  const selectorMoreInInput = createSelector(
    [
      (state: RootState) => {
        expensiveComputation()
        return state.todos
      },
    ],
    todos => todos.filter(todo => todo.completed),
  )

  const nonMemoized = countRecomputations((state: RootState) => {
    expensiveComputation()
    return state.todos.filter(todo => todo.completed)
  })
  const commonOptions: Options = {
    iterations: 10,
    time: 0,
  }
  setFunctionNames({ selectorLessInInput, selectorMoreInInput, nonMemoized })
  const createOptions = <S extends OutputSelector>(
    selector: S,
    commonOptions: Options = {},
  ) => {
    const options: Options = {
      setup: (task, mode) => {
        if (mode === 'warmup') return
        task.opts = {
          beforeEach: () => {
            store.dispatch(toggleRead(1))
          },
          afterAll: () => {
            logSelectorRecomputations(selector)
          },
        }
      },
    }
    return { ...commonOptions, ...options }
  }
  bench(
    selectorLessInInput,
    () => {
      runSelector(selectorLessInInput)
    },
    createOptions(selectorLessInInput, commonOptions),
  )
  bench(
    selectorMoreInInput,
    () => {
      runSelector(selectorMoreInInput)
    },
    createOptions(selectorMoreInInput, commonOptions),
  )
  bench(
    nonMemoized,
    () => {
      runSelector(nonMemoized)
    },
    {
      ...commonOptions,
      setup: (task, mode) => {
        if (mode === 'warmup') return
        nonMemoized.resetRecomputations()
        task.opts = {
          beforeEach: () => {
            store.dispatch(toggleCompleted(1))
          },
          afterAll: () => {
            logFunctionInfo(nonMemoized, nonMemoized.recomputations())
          },
        }
      },
    },
  )
})

// This benchmark is made to test to see at what point it becomes beneficial
// to use reselect to memoize a function that is a plain field accessor.
describe('Reselect vs standalone memoization for field access', () => {
  const store = setupStore()
  const runSelector = (selector: Selector) => {
    runMultipleTimes(selector, 1_000_000, store.getState())
  }
  const commonOptions: Options = {
    // warmupIterations: 0,
    // warmupTime: 0,
    // iterations: 10,
    // time: 0
  }
  const fieldAccessorWithReselect = createSelector(
    [(state: RootState) => state.users],
    users => users.appSettings,
  )
  const fieldAccessorWithMemoize = countRecomputations(
    lruMemoize((state: RootState) => {
      return state.users.appSettings
    }),
  )
  const nonMemoizedAccessor = countRecomputations(
    (state: RootState) => state.users.appSettings,
  )

  setFunctionNames({
    fieldAccessorWithReselect,
    fieldAccessorWithMemoize,
    nonMemoizedAccessor,
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
          beforeEach: () => {
            store.dispatch(toggleCompleted(1))
          },
          afterAll: () => {
            logSelectorRecomputations(selector)
          },
        }
      },
    }
    return { ...commonOptions, ...options }
  }
  bench(
    fieldAccessorWithReselect,
    () => {
      runSelector(fieldAccessorWithReselect)
    },
    createOptions(fieldAccessorWithReselect, commonOptions),
  )
  bench(
    fieldAccessorWithMemoize,
    () => {
      runSelector(fieldAccessorWithMemoize)
    },
    {
      ...commonOptions,
      setup: (task, mode) => {
        if (mode === 'warmup') return
        fieldAccessorWithMemoize.resetRecomputations()
        fieldAccessorWithMemoize.clearCache()
        task.opts = {
          beforeEach: () => {
            store.dispatch(toggleCompleted(1))
          },
          afterAll: () => {
            logFunctionInfo(
              fieldAccessorWithMemoize,
              fieldAccessorWithMemoize.recomputations(),
            )
          },
        }
      },
    },
  )
  bench(
    nonMemoizedAccessor,
    () => {
      runSelector(nonMemoizedAccessor)
    },
    {
      ...commonOptions,
      setup: (task, mode) => {
        if (mode === 'warmup') return
        nonMemoizedAccessor.resetRecomputations()
        task.opts = {
          beforeEach: () => {
            store.dispatch(toggleCompleted(1))
          },
          afterAll: () => {
            logFunctionInfo(
              nonMemoizedAccessor,
              nonMemoizedAccessor.recomputations(),
            )
          },
        }
      },
    },
  )
})
