import type { AnyFunction } from '@internal/types'
import type { OutputSelector, Selector } from 'reselect'
import {
  createSelector,
  lruMemoize,
  referenceEqualityCheck,
  weakMapMemoize,
} from 'reselect'
import type { Options } from 'tinybench'
import { bench } from 'vitest'
import {
  logSelectorRecomputations,
  setFunctionNames,
  setupStore,
  toggleCompleted,
  type RootState,
} from '../testUtils'

describe('memoize functions performance with resultEqualityCheck set to referenceEqualityCheck vs. without resultEqualityCheck', () => {
  describe('comparing selectors created with createSelector', () => {
    const store = setupStore()

    const arrayOfNumbers = Array.from({ length: 1_000 }, (num, index) => index)

    const commonOptions: Options = {
      iterations: 10_000,
      time: 0,
    }

    const runSelector = <S extends Selector>(selector: S) => {
      arrayOfNumbers.forEach(num => {
        selector(store.getState())
      })
    }

    const createAppSelector = createSelector.withTypes<RootState>()

    const selectTodoIdsWeakMap = createAppSelector(
      [state => state.todos],
      todos => todos.map(({ id }) => id),
    )

    const selectTodoIdsWeakMapWithResultEqualityCheck = createAppSelector(
      [state => state.todos],
      todos => todos.map(({ id }) => id),
      {
        memoizeOptions: { resultEqualityCheck: referenceEqualityCheck },
        argsMemoizeOptions: { resultEqualityCheck: referenceEqualityCheck },
      },
    )

    const selectTodoIdsLru = createAppSelector(
      [state => state.todos],
      todos => todos.map(({ id }) => id),
      { memoize: lruMemoize, argsMemoize: lruMemoize },
    )

    const selectTodoIdsLruWithResultEqualityCheck = createAppSelector(
      [state => state.todos],
      todos => todos.map(({ id }) => id),
      {
        memoize: lruMemoize,
        memoizeOptions: { resultEqualityCheck: referenceEqualityCheck },
        argsMemoize: lruMemoize,
        argsMemoizeOptions: { resultEqualityCheck: referenceEqualityCheck },
      },
    )

    const selectors = {
      selectTodoIdsWeakMap,
      selectTodoIdsWeakMapWithResultEqualityCheck,
      selectTodoIdsLru,
      selectTodoIdsLruWithResultEqualityCheck,
    }

    setFunctionNames(selectors)

    const createOptions = <S extends OutputSelector>(selector: S) => {
      const options: Options = {
        setup: (task, mode) => {
          if (mode === 'warmup') return

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

    Object.values(selectors).forEach(selector => {
      bench(
        selector,
        () => {
          runSelector(selector)
        },
        createOptions(selector),
      )
    })
  })

  describe('comparing selectors created with memoize functions', () => {
    const store = setupStore()

    const arrayOfNumbers = Array.from(
      { length: 100_000 },
      (num, index) => index,
    )

    const commonOptions: Options = {
      iterations: 1000,
      time: 0,
    }

    const runSelector = <S extends Selector>(selector: S) => {
      arrayOfNumbers.forEach(num => {
        selector(store.getState())
      })
    }

    const selectTodoIdsWeakMap = weakMapMemoize((state: RootState) =>
      state.todos.map(({ id }) => id),
    )

    const selectTodoIdsWeakMapWithResultEqualityCheck = weakMapMemoize(
      (state: RootState) => state.todos.map(({ id }) => id),
      { resultEqualityCheck: referenceEqualityCheck },
    )

    const selectTodoIdsLru = lruMemoize((state: RootState) =>
      state.todos.map(({ id }) => id),
    )

    const selectTodoIdsLruWithResultEqualityCheck = lruMemoize(
      (state: RootState) => state.todos.map(({ id }) => id),
      { resultEqualityCheck: referenceEqualityCheck },
    )

    const memoizedFunctions = {
      selectTodoIdsWeakMap,
      selectTodoIdsWeakMapWithResultEqualityCheck,
      selectTodoIdsLru,
      selectTodoIdsLruWithResultEqualityCheck,
    }

    setFunctionNames(memoizedFunctions)

    const createOptions = <
      Func extends AnyFunction & { resultsCount: () => number },
    >(
      memoizedFunction: Func,
    ) => {
      const options: Options = {
        setup: (task, mode) => {
          if (mode === 'warmup') return

          task.opts = {
            beforeEach: () => {
              store.dispatch(toggleCompleted(1))
            },

            afterAll: () => {
              console.log(
                memoizedFunction.name,
                memoizedFunction.resultsCount(),
              )
            },
          }
        },
      }
      return { ...commonOptions, ...options }
    }

    Object.values(memoizedFunctions).forEach(memoizedFunction => {
      bench(
        memoizedFunction,
        () => {
          runSelector(memoizedFunction)
        },
        createOptions(memoizedFunction),
      )
    })
  })
})
