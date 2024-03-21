import { shallowEqual } from 'react-redux'
import {
  createSelector,
  createSelectorCreator,
  referenceEqualityCheck,
  weakMapMemoize,
} from 'reselect'
import type { RootState } from './testUtils'
import { localTest, setEnvToProd, toggleCompleted } from './testUtils'

// Construct 1E6 states for perf test outside of the perf test so as to not change the execute time of the test function
const numOfStates = 1_000_000
interface StateA {
  a: number
}

interface StateAB {
  a: number
  b: number
}

interface StateSub {
  sub: {
    a: number
  }
}

const states: StateAB[] = []

for (let i = 0; i < numOfStates; i++) {
  states.push({ a: 1, b: 2 })
}

describe('Basic selector behavior with weakMapMemoize', () => {
  const createSelector = createSelectorCreator(weakMapMemoize)

  test('basic selector', () => {
    // console.log('Selector test')
    const selector = createSelector(
      (state: StateA) => state.a,
      a => a,
      { devModeChecks: { identityFunctionCheck: 'never' } },
    )
    const firstState = { a: 1 }
    const firstStateNewPointer = { a: 1 }
    const secondState = { a: 2 }

    expect(selector(firstState)).toBe(1)
    expect(selector(firstState)).toBe(1)
    expect(selector.recomputations()).toBe(1)
    expect(selector(firstStateNewPointer)).toBe(1)
    expect(selector.recomputations()).toBe(1)
    expect(selector(secondState)).toBe(2)
    expect(selector.recomputations()).toBe(2)
  })

  test("don't pass extra parameters to inputSelector when only called with the state", () => {
    const selector = createSelector(
      (...params: any[]) => params.length,
      a => a,
      { devModeChecks: { identityFunctionCheck: 'never' } },
    )
    expect(selector({})).toBe(1)
  })

  test('basic selector multiple keys', () => {
    const selector = createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
    )
    const state1 = { a: 1, b: 2 }
    expect(selector(state1)).toBe(3)
    expect(selector(state1)).toBe(3)
    expect(selector.recomputations()).toBe(1)
    const state2 = { a: 3, b: 2 }
    expect(selector(state2)).toBe(5)
    expect(selector(state2)).toBe(5)
    expect(selector.recomputations()).toBe(2)
  })

  test('basic selector invalid input selector', () => {
    expect(() =>
      createSelector(
        // @ts-ignore
        (state: StateAB) => state.a,
        function input2(state: StateAB) {
          return state.b
        },
        'not a function',
        (a: any, b: any) => a + b,
      ),
    ).toThrow(
      'createSelector expects all input-selectors to be functions, but received the following types: [function unnamed(), function input2(), string]',
    )

    expect(() =>
      // @ts-ignore
      createSelector((state: StateAB) => state.a, 'not a function'),
    ).toThrow(
      'createSelector expects an output function after the inputs, but received: [string]',
    )
  })

  test('memoized composite arguments', () => {
    const selector = createSelector(
      (state: StateSub) => state.sub,
      sub => sub.a,
    )
    const state1 = { sub: { a: 1 } }
    expect(selector(state1)).toEqual(1)
    expect(selector(state1)).toEqual(1)
    expect(selector.recomputations()).toBe(1)
    const state2 = { sub: { a: 2 } }
    expect(selector(state2)).toEqual(2)
    expect(selector.recomputations()).toBe(2)
  })

  test('first argument can be an array', () => {
    const selector = createSelector(
      [state => state.a, state => state.b],
      (a, b) => {
        return a + b
      },
    )
    expect(selector({ a: 1, b: 2 })).toBe(3)
    expect(selector({ a: 1, b: 2 })).toBe(3)
    expect(selector.recomputations()).toBe(1)
    expect(selector({ a: 3, b: 2 })).toBe(5)
    expect(selector.recomputations()).toBe(2)
  })

  test('can accept props', () => {
    let called = 0
    const selector = createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (state: StateAB, props: { c: number }) => props.c,
      (a, b, c) => {
        called++
        return a + b + c
      },
    )
    expect(selector({ a: 1, b: 2 }, { c: 100 })).toBe(103)
  })

  test('recomputes result after exception', () => {
    let called = 0
    const selector = createSelector(
      (state: StateA) => state.a,
      () => {
        called++
        throw Error('test error')
      },
    )
    expect(() => selector({ a: 1 })).toThrow('test error')
    expect(() => selector({ a: 1 })).toThrow('test error')
    expect(called).toBe(2)
  })

  test('memoizes previous result before exception', () => {
    let called = 0
    const selector = createSelector(
      (state: StateA) => state.a,
      a => {
        called++
        if (a > 1) throw Error('test error')
        return a
      },
      { devModeChecks: { identityFunctionCheck: 'never' } },
    )
    const state1 = { a: 1 }
    const state2 = { a: 2 }
    expect(selector(state1)).toBe(1)
    expect(() => selector(state2)).toThrow('test error')
    expect(selector(state1)).toBe(1)
    expect(called).toBe(2)
  })
})

const isCoverage = process.env.COVERAGE

// don't run performance tests for coverage
describe.skipIf(isCoverage)('weakmapMemoize performance tests', () => {
  beforeEach(setEnvToProd)

  test('basic selector cache hit performance', () => {
    const selector = createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
      { devModeChecks: { identityFunctionCheck: 'never' } },
    )
    const state1 = { a: 1, b: 2 }

    const start = performance.now()
    for (let i = 0; i < 1_000_000; i++) {
      selector(state1)
    }
    const totalTime = performance.now() - start

    expect(selector(state1)).toBe(3)
    expect(selector.recomputations()).toBe(1)
    // Expected a million calls to a selector with the same arguments to take less than 1 second
    expect(totalTime).toBeLessThan(2000)
  })

  test('basic selector cache hit performance for state changes but shallowly equal selector args', () => {
    const selector = createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
      {
        devModeChecks: {
          identityFunctionCheck: 'never',
          inputStabilityCheck: 'never',
        },
      },
    )

    const start = performance.now()
    for (let i = 0; i < 1_000_000; i++) {
      selector(states[i])
    }
    const totalTime = performance.now() - start

    expect(selector(states[0])).toBe(3)
    expect(selector.recomputations()).toBe(1)

    // Expected a million calls to a selector with the same arguments to take less than 1 second
    expect(totalTime).toBeLessThan(2000)
  })
})

describe('weakMapMemoize integration with resultEqualityCheck', () => {
  const createAppSelector = createSelector.withTypes<RootState>()

  const resultEqualityCheck = vi
    .fn(shallowEqual)
    .mockName('resultEqualityCheck')

  afterEach(() => {
    resultEqualityCheck.mockClear()
  })

  localTest(
    'resultEqualityCheck works correctly when set to shallowEqual',
    ({ store }) => {
      const selectTodoIds = weakMapMemoize(
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
    'resultEqualityCheck is not called on the first output selector call',
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
    'weakMapMemoize with resultEqualityCheck set to referenceEqualityCheck works the same as weakMapMemoize without resultEqualityCheck',
    ({ store }) => {
      const resultEqualityCheck = vi
        .fn(referenceEqualityCheck)
        .mockName('resultEqualityCheck')

      const selectTodoIdsWithResultEqualityCheck = weakMapMemoize(
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

      const selectTodoIds = weakMapMemoize((state: RootState) =>
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
