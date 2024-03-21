// TODO: Add test for React Redux connect function

import { shallowEqual } from 'react-redux'
import {
  createSelectorCreator,
  lruMemoize,
  referenceEqualityCheck,
} from 'reselect'
import type { RootState } from './testUtils'
import { localTest, toggleCompleted } from './testUtils'

const createSelectorLru = createSelectorCreator({
  memoize: lruMemoize,
  argsMemoize: lruMemoize,
})

describe(lruMemoize, () => {
  test('Basic memoization', () => {
    let called = 0
    const memoized = lruMemoize(state => {
      called++
      return state.a
    })

    const o1 = { a: 1 }
    const o2 = { a: 2 }
    expect(memoized(o1)).toBe(1)
    expect(memoized(o1)).toBe(1)
    expect(called).toBe(1)
    expect(memoized(o2)).toBe(2)
    expect(called).toBe(2)
  })

  test('Memoizes with multiple arguments', () => {
    const memoized = lruMemoize((...args) =>
      args.reduce((sum, value) => sum + value, 0),
    )
    expect(memoized(1, 2)).toBe(3)
    expect(memoized(1)).toBe(1)
  })

  test('Memoizes with equalityCheck override', () => {
    // a rather absurd equals operation we can verify in tests
    let called = 0
    const valueEquals = (a: any, b: any) => typeof a === typeof b
    const memoized = lruMemoize(a => {
      called++
      return a
    }, valueEquals)
    expect(memoized(1)).toBe(1)
    expect(memoized(2)).toBe(1) // yes, really true
    expect(called).toBe(1)
    expect(memoized('A')).toBe('A')
    expect(called).toBe(2)
  })

  test('Passes correct objects to equalityCheck', () => {
    let fallthroughs = 0
    function shallowEqual(newVal: any, oldVal: any) {
      if (newVal === oldVal) return true

      fallthroughs += 1 // code below is expensive and should be bypassed when possible

      let countA = 0
      let countB = 0
      for (const key in newVal) {
        if (
          Object.hasOwnProperty.call(newVal, key) &&
          newVal[key] !== oldVal[key]
        )
          return false
        countA++
      }
      for (const key in oldVal) {
        if (Object.hasOwnProperty.call(oldVal, key)) countB++
      }
      return countA === countB
    }

    const someObject = { foo: 'bar' }
    const anotherObject = { foo: 'bar' }
    const memoized = lruMemoize(a => a, shallowEqual)

    // the first call to `memoized` doesn't hit because `lruMemoize.lastArgs` is uninitialized
    // and so `equalityCheck` is never called
    memoized(someObject)
    // first call does not shallow compare
    expect(fallthroughs).toBe(0)

    // the next call, with a different object reference, does fall through
    memoized(anotherObject)

    // call with different object does shallow compare
    expect(fallthroughs).toBe(1)

    /*
    This test was useful when we had a cache size of 1 previously, and always saved `lastArgs`.
    But, with the new implementation, this doesn't make sense any more.

    // the third call does not fall through because `lruMemoize` passes `anotherObject` as
    // both the `newVal` and `oldVal` params. This allows `shallowEqual` to be much more performant
    // than if it had passed `someObject` as `oldVal`, even though `someObject` and `anotherObject`
    // are shallowly equal
    memoized(anotherObject)
    // call with same object as previous call does not shallow compare
    expect(fallthroughs).toBe(1)

    */
  })

  test('Accepts a max size greater than 1 with LRU cache behavior', () => {
    let funcCalls = 0

    const memoizer = lruMemoize(
      (state: any) => {
        funcCalls++
        return state
      },
      {
        maxSize: 3,
      },
    )

    // Initial call
    memoizer('a') // ['a']
    expect(funcCalls).toBe(1)

    // In cache - memoized
    memoizer('a') // ['a']
    expect(funcCalls).toBe(1)

    // Added
    memoizer('b') // ['b', 'a']
    expect(funcCalls).toBe(2)

    // Added
    memoizer('c') // ['c', 'b', 'a']
    expect(funcCalls).toBe(3)

    // Added, removes 'a'
    memoizer('d') // ['d', 'c', 'b']
    expect(funcCalls).toBe(4)

    // No longer in cache, re-added, removes 'b'
    memoizer('a') // ['a', 'd', 'c']
    expect(funcCalls).toBe(5)

    // In cache, moved to front
    memoizer('c') // ['c', 'a', 'd']
    expect(funcCalls).toBe(5)

    // Added, removes 'd'
    memoizer('e') // ['e', 'c', 'a']
    expect(funcCalls).toBe(6)

    // No longer in cache, re-added, removes 'a'
    memoizer('d') // ['d', 'e', 'c']
    expect(funcCalls).toBe(7)
  })

  test('Allows reusing an existing result if they are equivalent', () => {
    interface Todo {
      id: number
      name: string
    }

    const todos1: Todo[] = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
    ]
    const todos2 = todos1.slice()
    todos2[2] = { id: 3, name: 'd' }

    function is(x: unknown, y: unknown) {
      if (x === y) {
        return x !== 0 || y !== 0 || 1 / x === 1 / y
      } else {
        return x !== x && y !== y
      }
    }

    function shallowEqual(objA: any, objB: any) {
      if (is(objA, objB)) return true

      if (
        typeof objA !== 'object' ||
        objA === null ||
        typeof objB !== 'object' ||
        objB === null
      ) {
        return false
      }

      const keysA = Object.keys(objA)
      const keysB = Object.keys(objB)

      if (keysA.length !== keysB.length) return false

      for (let i = 0; i < keysA.length; i++) {
        if (
          !Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
          !is(objA[keysA[i]], objB[keysA[i]])
        ) {
          return false
        }
      }

      return true
    }

    for (const maxSize of [1, 3]) {
      let funcCalls = 0

      const memoizer = lruMemoize(
        (state: Todo[]) => {
          funcCalls++
          return state.map(todo => todo.id)
        },
        {
          maxSize,
          resultEqualityCheck: shallowEqual,
        },
      )

      const ids1 = memoizer(todos1)
      expect(funcCalls).toBe(1)

      const ids2 = memoizer(todos1)
      expect(funcCalls).toBe(1)
      expect(ids2).toBe(ids1)

      const ids3 = memoizer(todos2)
      expect(funcCalls).toBe(2)
      expect(ids3).toBe(ids1)
    }
  })

  test('updates the cache key even if resultEqualityCheck is a hit', () => {
    const selector = vi.fn(x => x)
    const equalityCheck = vi.fn((a, b) => a === b)
    const resultEqualityCheck = vi.fn((a, b) => typeof a === typeof b)

    const memoizedFn = lruMemoize(selector, {
      maxSize: 1,
      resultEqualityCheck,
      equalityCheck,
    })

    // initialize the cache
    memoizedFn('cache this result')
    expect(selector).toBeCalledTimes(1)

    // resultEqualityCheck hit (with a different cache key)
    const result = memoizedFn('arg1')
    expect(equalityCheck).toHaveLastReturnedWith(false)
    expect(resultEqualityCheck).toHaveLastReturnedWith(true)
    expect(result).toBe('cache this result')
    expect(selector).toBeCalledTimes(2)

    // cache key should now be updated
    const result2 = memoizedFn('arg1')
    expect(result2).toBe('cache this result')
    expect(equalityCheck).toHaveLastReturnedWith(true)
    expect(selector).toBeCalledTimes(2)
  })

  // Issue #527
  test('Allows caching a value of `undefined`', () => {
    const state = {
      foo: { baz: 'baz' },
      bar: 'qux',
    }

    const fooChangeSpy = vi.fn()

    const fooChangeHandler = createSelectorLru(
      (state: any) => state.foo,
      fooChangeSpy,
    )

    fooChangeHandler(state)
    expect(fooChangeSpy.mock.calls.length).toEqual(1)

    // no change
    fooChangeHandler(state)
    // this would fail
    expect(fooChangeSpy.mock.calls.length).toEqual(1)

    const state2 = { a: 1 }
    let count = 0

    const selector = createSelectorLru([(state: any) => state.a], () => {
      count++
      return undefined
    })

    selector(state)
    expect(count).toBe(2)
    selector(state)
    expect(count).toBe(2)
  })

  test('Accepts an options object as an arg', () => {
    let memoizer1Calls = 0

    const acceptsEqualityCheckAsOption = lruMemoize((a: any) => a, {
      equalityCheck: (a, b) => {
        memoizer1Calls++
        return a === b
      },
    })

    acceptsEqualityCheckAsOption(42)
    acceptsEqualityCheckAsOption(43)

    expect(memoizer1Calls).toBeGreaterThan(0)

    let called = 0
    const fallsBackToDefaultEqualityIfNoArgGiven = lruMemoize(
      state => {
        called++
        return state.a
      },
      {
        // no args
      },
    )

    const o1 = { a: 1 }
    const o2 = { a: 2 }
    expect(fallsBackToDefaultEqualityIfNoArgGiven(o1)).toBe(1)
    expect(fallsBackToDefaultEqualityIfNoArgGiven(o1)).toBe(1)
    expect(called).toBe(1)
    expect(fallsBackToDefaultEqualityIfNoArgGiven(o2)).toBe(2)
    expect(called).toBe(2)
  })

  test('Exposes a clearCache method on the memoized function', () => {
    let funcCalls = 0

    // Cache size of 1
    const memoizer = lruMemoize(
      (state: any) => {
        funcCalls++
        return state
      },
      {
        maxSize: 1,
      },
    )

    // Initial call
    memoizer('a') // ['a']
    expect(funcCalls).toBe(1)

    // In cache - memoized
    memoizer('a') // ['a']
    expect(funcCalls).toBe(1)

    memoizer.clearCache()

    // Cache was cleared
    memoizer('a')
    expect(funcCalls).toBe(2)

    funcCalls = 0

    // Test out maxSize of 3 + exposure via createSelector
    const selector = createSelectorLru(
      (state: string) => state,
      state => {
        funcCalls++
        return state
      },
      {
        memoizeOptions: { maxSize: 3 },
        devModeChecks: { identityFunctionCheck: 'never' },
      },
    )

    // Initial call
    selector('a') // ['a']
    expect(funcCalls).toBe(1)

    // In cache - memoized
    selector('a') // ['a']
    expect(funcCalls).toBe(1)

    // Added
    selector('b') // ['b', 'a']
    expect(funcCalls).toBe(2)

    // Added
    selector('c') // ['c', 'b', 'a']
    expect(funcCalls).toBe(3)

    // Already in cache
    selector('c') // ['c', 'b', 'a']
    expect(funcCalls).toBe(3)

    selector.memoizedResultFunc.clearCache()

    // Added
    selector('a') // ['a']
    expect(funcCalls).toBe(4)

    // Already in cache
    selector('a') // ['a']
    expect(funcCalls).toBe(4)

    // make sure clearCache is passed to the selector correctly
    selector.clearCache()

    // Cache was cleared
    // Note: the outer arguments wrapper function still has 'a' in its own size-1 cache, so passing
    // 'a' here would _not_ recalculate
    selector('b') // ['b']
    expect(funcCalls).toBe(5)
    // @ts-expect-error
    expect(selector.resultFunc.clearCache).toBeUndefined()
  })

  test('cache miss identifier does not collide with state values', () => {
    const state = ['NOT_FOUND', 'FOUND']

    type State = typeof state

    const createSelector = createSelectorCreator({
      memoize: lruMemoize,
      argsMemoize: lruMemoize,
    }).withTypes<State>()

    const selector = createSelector(
      [(state, id: number) => state[id]],
      state => state,
      {
        argsMemoizeOptions: { maxSize: 10 },
        memoizeOptions: { maxSize: 10 },
      },
    )

    const firstResult = selector(state, 0)

    expect(selector(state, 1)).toBe(selector(state, 1))

    const secondResult = selector(state, 0)

    expect(secondResult).toBe('NOT_FOUND')

    expect(firstResult).toBe(secondResult)

    expect(selector.recomputations()).toBe(2)
  })

  localTest(
    'maxSize should default to 1 when set to a number that is less than 1',
    ({ state, store }) => {
      const createSelectorLru = createSelectorCreator({
        memoize: lruMemoize,
        argsMemoize: lruMemoize,
        memoizeOptions: { maxSize: 0 },
        argsMemoizeOptions: { maxSize: 0 },
      }).withTypes<RootState>()

      const selectTodoIds = createSelectorLru([state => state.todos], todos =>
        todos.map(({ id }) => id),
      )

      expect(selectTodoIds(store.getState())).toBe(
        selectTodoIds(store.getState()),
      )

      expect(selectTodoIds.recomputations()).toBe(1)

      store.dispatch(toggleCompleted(0))

      expect(selectTodoIds(store.getState())).toBe(
        selectTodoIds(store.getState()),
      )

      expect(selectTodoIds.recomputations()).toBe(2)

      const selectTodoIdsLru = lruMemoize(
        (state: RootState) => state.todos.map(({ id }) => id),
        { maxSize: -2 },
      )

      expect(selectTodoIdsLru(state)).toBe(selectTodoIdsLru(state))
    },
  )
})

describe('lruMemoize integration with resultEqualityCheck', () => {
  const createAppSelector = createSelectorLru.withTypes<RootState>()

  const resultEqualityCheck = vi
    .fn(shallowEqual)
    .mockName('resultEqualityCheck')

  afterEach(() => {
    resultEqualityCheck.mockClear()
  })

  localTest(
    'resultEqualityCheck works when set to shallowEqual',
    ({ store }) => {
      const selectTodoIds = lruMemoize(
        (state: RootState) => state.todos.map(({ id }) => id),
        { resultEqualityCheck },
      )

      const firstResult = selectTodoIds(store.getState())

      store.dispatch(toggleCompleted(0))

      const secondResult = selectTodoIds(store.getState())

      expect(firstResult).toBe(secondResult)

      expect(selectTodoIds.resultsCount()).toBe(1)
    },
  )

  localTest(
    'resultEqualityCheck should not be called on the first output selector call',
    ({ store }) => {
      const selectTodoIds = createAppSelector(
        [state => state.todos],
        todos => todos.map(({ id }) => id),
        {
          memoizeOptions: { resultEqualityCheck },
          devModeChecks: { inputStabilityCheck: 'once' },
        },
      )

      expect(selectTodoIds(store.getState())).to.be.an('array').that.is.not
        .empty

      expect(resultEqualityCheck).not.toHaveBeenCalled()

      store.dispatch(toggleCompleted(0))

      expect(selectTodoIds.lastResult()).toBe(selectTodoIds(store.getState()))

      expect(resultEqualityCheck).toHaveBeenCalledOnce()

      expect(selectTodoIds.memoizedResultFunc.resultsCount()).toBe(1)

      expect(selectTodoIds.recomputations()).toBe(2)

      expect(selectTodoIds.resultsCount()).toBe(2)

      expect(selectTodoIds.dependencyRecomputations()).toBe(2)

      store.dispatch(toggleCompleted(0))

      expect(selectTodoIds.lastResult()).toBe(selectTodoIds(store.getState()))

      expect(resultEqualityCheck).toHaveBeenCalledTimes(2)

      expect(selectTodoIds.memoizedResultFunc.resultsCount()).toBe(1)

      expect(selectTodoIds.recomputations()).toBe(3)

      expect(selectTodoIds.resultsCount()).toBe(3)

      expect(selectTodoIds.dependencyRecomputations()).toBe(3)
    },
  )

  localTest(
    'lruMemoize with resultEqualityCheck set to referenceEqualityCheck works the same as lruMemoize without resultEqualityCheck',
    ({ store }) => {
      const resultEqualityCheck = vi
        .fn(referenceEqualityCheck)
        .mockName('resultEqualityCheck')

      const selectTodoIdsWithResultEqualityCheck = lruMemoize(
        (state: RootState) => state.todos.map(({ id }) => id),
        { resultEqualityCheck },
      )

      const firstResultWithResultEqualityCheck =
        selectTodoIdsWithResultEqualityCheck(store.getState())

      expect(resultEqualityCheck).not.toHaveBeenCalled()

      store.dispatch(toggleCompleted(0))

      const secondResultWithResultEqualityCheck =
        selectTodoIdsWithResultEqualityCheck(store.getState())

      expect(firstResultWithResultEqualityCheck).not.toBe(
        secondResultWithResultEqualityCheck,
      )

      expect(firstResultWithResultEqualityCheck).toStrictEqual(
        secondResultWithResultEqualityCheck,
      )

      expect(selectTodoIdsWithResultEqualityCheck.resultsCount()).toBe(2)

      const selectTodoIds = lruMemoize((state: RootState) =>
        state.todos.map(({ id }) => id),
      )

      const firstResult = selectTodoIds(store.getState())

      store.dispatch(toggleCompleted(0))

      const secondResult = selectTodoIds(store.getState())

      expect(firstResult).not.toBe(secondResult)

      expect(firstResult).toStrictEqual(secondResult)

      expect(selectTodoIds.resultsCount()).toBe(2)

      resultEqualityCheck.mockClear()
    },
  )
})

describe('lruMemoize integration with resultEqualityCheck', () => {
  const createAppSelector = createSelectorLru.withTypes<RootState>()

  const resultEqualityCheck = vi
    .fn(shallowEqual)
    .mockName('resultEqualityCheck')

  afterEach(() => {
    resultEqualityCheck.mockClear()
  })

  localTest(
    'resultEqualityCheck works when set to shallowEqual',
    ({ store }) => {
      const selectTodoIds = lruMemoize(
        (state: RootState) => state.todos.map(({ id }) => id),
        { resultEqualityCheck },
      )

      const firstResult = selectTodoIds(store.getState())

      store.dispatch(toggleCompleted(0))

      const secondResult = selectTodoIds(store.getState())

      expect(firstResult).toBe(secondResult)

      expect(selectTodoIds.resultsCount()).toBe(1)
    },
  )

  localTest(
    'resultEqualityCheck should not be called on the first output selector call',
    ({ store }) => {
      const selectTodoIds = createAppSelector(
        [state => state.todos],
        todos => todos.map(({ id }) => id),
        {
          memoizeOptions: { resultEqualityCheck },
          devModeChecks: { inputStabilityCheck: 'once' },
        },
      )

      expect(selectTodoIds(store.getState())).to.be.an('array').that.is.not
        .empty

      expect(resultEqualityCheck).not.toHaveBeenCalled()

      store.dispatch(toggleCompleted(0))

      expect(selectTodoIds.lastResult()).toBe(selectTodoIds(store.getState()))

      expect(resultEqualityCheck).toHaveBeenCalledOnce()

      expect(selectTodoIds.memoizedResultFunc.resultsCount()).toBe(1)

      expect(selectTodoIds.recomputations()).toBe(2)

      expect(selectTodoIds.resultsCount()).toBe(2)

      expect(selectTodoIds.dependencyRecomputations()).toBe(2)

      store.dispatch(toggleCompleted(0))

      expect(selectTodoIds.lastResult()).toBe(selectTodoIds(store.getState()))

      expect(resultEqualityCheck).toHaveBeenCalledTimes(2)

      expect(selectTodoIds.memoizedResultFunc.resultsCount()).toBe(1)

      expect(selectTodoIds.recomputations()).toBe(3)

      expect(selectTodoIds.resultsCount()).toBe(3)

      expect(selectTodoIds.dependencyRecomputations()).toBe(3)
    },
  )

  localTest(
    'lruMemoize with resultEqualityCheck set to referenceEqualityCheck works the same as lruMemoize without resultEqualityCheck',
    ({ store }) => {
      const resultEqualityCheck = vi
        .fn(referenceEqualityCheck)
        .mockName('resultEqualityCheck')

      const selectTodoIdsWithResultEqualityCheck = lruMemoize(
        (state: RootState) => state.todos.map(({ id }) => id),
        { resultEqualityCheck },
      )

      const firstResultWithResultEqualityCheck =
        selectTodoIdsWithResultEqualityCheck(store.getState())

      expect(resultEqualityCheck).not.toHaveBeenCalled()

      store.dispatch(toggleCompleted(0))

      const secondResultWithResultEqualityCheck =
        selectTodoIdsWithResultEqualityCheck(store.getState())

      expect(firstResultWithResultEqualityCheck).not.toBe(
        secondResultWithResultEqualityCheck,
      )

      expect(firstResultWithResultEqualityCheck).toStrictEqual(
        secondResultWithResultEqualityCheck,
      )

      expect(selectTodoIdsWithResultEqualityCheck.resultsCount()).toBe(2)

      const selectTodoIds = lruMemoize((state: RootState) =>
        state.todos.map(({ id }) => id),
      )

      const firstResult = selectTodoIds(store.getState())

      store.dispatch(toggleCompleted(0))

      const secondResult = selectTodoIds(store.getState())

      expect(firstResult).not.toBe(secondResult)

      expect(firstResult).toStrictEqual(secondResult)

      expect(selectTodoIds.resultsCount()).toBe(2)

      resultEqualityCheck.mockClear()
    },
  )
})
