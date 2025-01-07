// TODO: Add test for React Redux connect function

import lodashMemoize from 'lodash/memoize'
import microMemoize from 'micro-memoize'
import {
  unstable_autotrackMemoize as autotrackMemoize,
  createSelector,
  createSelectorCreator,
  lruMemoize,
  weakMapMemoize,
} from 'reselect'

import type { OutputSelector, OutputSelectorFields } from 'reselect'
import type { RootState } from './testUtils'
import {
  addTodo,
  deepClone,
  isMemoizedSelector,
  localTest,
  setEnvToProd,
  toggleCompleted,
} from './testUtils'

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

describe('Basic selector behavior', () => {
  test('basic selector', () => {
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

  const isCoverage = process.env.COVERAGE

  describe.skipIf(isCoverage)('performance checks', () => {
    beforeAll(setEnvToProd)

    // don't run performance tests for coverage
    test.skipIf(isCoverage)('basic selector cache hit performance', () => {
      const selector = createSelector(
        (state: StateAB) => state.a,
        (state: StateAB) => state.b,
        (a, b) => a + b,
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

    // don't run performance tests for coverage
    test.skipIf(isCoverage)(
      'basic selector cache hit performance for state changes but shallowly equal selector args',
      () => {
        const selector = createSelector(
          (state: StateAB) => state.a,
          (state: StateAB) => state.b,
          (a, b) => a + b,
        )

        const start = new Date()
        for (let i = 0; i < numOfStates; i++) {
          selector(states[i])
        }
        const totalTime = new Date().getTime() - start.getTime()

        expect(selector(states[0])).toBe(3)
        expect(selector.recomputations()).toBe(1)

        // Expected a million calls to a selector with the same arguments to take less than 1 second
        expect(totalTime).toBeLessThan(2000)
      },
    )
  })
  test('memoized composite arguments', () => {
    const selector = createSelector(
      (state: StateSub) => state.sub,
      sub => sub,
      { devModeChecks: { identityFunctionCheck: 'never' } },
    )
    const state1 = { sub: { a: 1 } }
    expect(selector(state1)).toEqual({ a: 1 })
    expect(selector(state1)).toEqual({ a: 1 })
    expect(selector.recomputations()).toBe(1)
    const state2 = { sub: { a: 2 } }
    expect(selector(state2)).toEqual({ a: 2 })
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

describe('Combining selectors', () => {
  test('chained selector', () => {
    const selector1 = createSelector(
      (state: StateSub) => state.sub,
      sub => sub,
      { devModeChecks: { identityFunctionCheck: 'never' } },
    )
    const selector2 = createSelector(selector1, sub => sub.a)
    const state1 = { sub: { a: 1 } }
    expect(selector2(state1)).toBe(1)
    expect(selector2(state1)).toBe(1)
    expect(selector2.recomputations()).toBe(1)
    const state2 = { sub: { a: 2 } }
    expect(selector2(state2)).toBe(2)
    expect(selector2.recomputations()).toBe(2)
  })

  test('chained selector with props', () => {
    const selector1 = createSelector(
      (state: StateSub) => state.sub,
      (state: StateSub, props: { x: number; y: number }) => props.x,
      (sub, x) => ({ sub, x }),
    )
    const selector2 = createSelector(
      selector1,
      (state: StateSub, props: { x: number; y: number }) => props.y,
      (param, y) => param.sub.a + param.x + y,
    )
    const state1 = { sub: { a: 1 } }
    expect(selector2(state1, { x: 100, y: 200 })).toBe(301)
    expect(selector2(state1, { x: 100, y: 200 })).toBe(301)
    expect(selector2.recomputations()).toBe(1)
    const state2 = { sub: { a: 2 } }
    expect(selector2(state2, { x: 100, y: 201 })).toBe(303)
    expect(selector2.recomputations()).toBe(2)
  })

  test('chained selector with variadic args', () => {
    const selector1 = createSelector(
      (state: StateSub) => state.sub,
      (state: StateSub, props: { x: number; y: number }, another: number) =>
        props.x + another,
      (sub, x) => ({ sub, x }),
    )
    const selector2 = createSelector(
      selector1,
      (state: StateSub, props: { x: number; y: number }) => props.y,
      (param, y) => param.sub.a + param.x + y,
    )
    const state1 = { sub: { a: 1 } }
    expect(selector2(state1, { x: 100, y: 200 }, 100)).toBe(401)
    expect(selector2(state1, { x: 100, y: 200 }, 100)).toBe(401)
    expect(selector2.recomputations()).toBe(1)
    const state2 = { sub: { a: 2 } }
    expect(selector2(state2, { x: 100, y: 201 }, 200)).toBe(503)
    expect(selector2.recomputations()).toBe(2)
  })

  test('override valueEquals', () => {
    // a rather absurd equals operation we can verify in tests
    const createOverridenSelector = createSelectorCreator(
      lruMemoize,
      (a, b) => typeof a === typeof b,
    )
    const selector = createOverridenSelector(
      (state: StateA) => state.a,
      a => a,
      { devModeChecks: { identityFunctionCheck: 'never' } },
    )
    expect(selector({ a: 1 })).toBe(1)
    expect(selector({ a: 2 })).toBe(1) // yes, really true
    expect(selector.recomputations()).toBe(1)
    // @ts-expect-error
    expect(selector({ a: 'A' })).toBe('A')
    expect(selector.recomputations()).toBe(2)
  })
})

describe('Customizing selectors', () => {
  test('custom memoize', () => {
    const hashFn = (...args: any[]) =>
      args.reduce((acc, val) => acc + '-' + JSON.stringify(val))
    const customSelectorCreator = createSelectorCreator(lodashMemoize, hashFn)
    const selector = customSelectorCreator(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
    )
    expect(selector({ a: 1, b: 2 })).toBe(3)
    expect(selector({ a: 1, b: 2 })).toBe(3)
    expect(selector.recomputations()).toBe(1)
    expect(selector({ a: 1, b: 3 })).toBe(4)
    expect(selector.recomputations()).toBe(2)
    expect(selector({ a: 1, b: 3 })).toBe(4)
    expect(selector.recomputations()).toBe(2)
    expect(selector({ a: 2, b: 3 })).toBe(5)
    expect(selector.recomputations()).toBe(3)
    // TODO: Check correct memoize function was called
  })

  test('createSelector accepts direct memoizer arguments', () => {
    let memoizer1Calls = 0
    let memoizer2Calls = 0
    let memoizer3Calls = 0

    const lruMemoizeAcceptsFirstArgDirectly = createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
      {
        memoize: lruMemoize,
        memoizeOptions: (a, b) => {
          memoizer1Calls++
          return a === b
        },
      },
    )

    lruMemoizeAcceptsFirstArgDirectly({ a: 1, b: 2 })
    lruMemoizeAcceptsFirstArgDirectly({ a: 1, b: 3 })

    expect(memoizer1Calls).toBeGreaterThan(0)

    const lruMemoizeAcceptsArgsAsArray = createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
      {
        memoize: lruMemoize,
        memoizeOptions: [
          (a, b) => {
            memoizer2Calls++
            return a === b
          },
        ],
      },
    )

    lruMemoizeAcceptsArgsAsArray({ a: 1, b: 2 })
    lruMemoizeAcceptsArgsAsArray({ a: 1, b: 3 })

    expect(memoizer2Calls).toBeGreaterThan(0)

    const createSelectorWithSeparateArg = createSelectorCreator(
      lruMemoize,
      (a, b) => {
        memoizer3Calls++
        return a === b
      },
    )

    const lruMemoizeAcceptsArgFromCSC = createSelectorWithSeparateArg(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b,
    )

    lruMemoizeAcceptsArgFromCSC({ a: 1, b: 2 })
    lruMemoizeAcceptsArgFromCSC({ a: 1, b: 3 })

    expect(memoizer3Calls).toBeGreaterThan(0)
  })

  localTest.todo(
    'Test order of execution in a selector',
    ({ store, state }) => {
      // original options untouched.
      const selectorOriginal = createSelector(
        (state: RootState) => state.todos,
        todos => todos.map(({ id }) => id),
        {
          memoize: lruMemoize,
          devModeChecks: { inputStabilityCheck: 'always' },
          memoizeOptions: {
            equalityCheck: (a, b) => false,
            resultEqualityCheck: (a, b) => false,
          },
        },
      )
      selectorOriginal(deepClone(state))
      selectorOriginal(deepClone(state))
      const selectorDefaultParametric = createSelector(
        [
          (state: RootState, id: number) => id,
          (state: RootState) => state.todos,
        ],
        (id, todos) => todos.filter(todo => todo.id === id),
      )
      selectorDefaultParametric(state, 1)
      selectorDefaultParametric(state, 1)
    },
  )
})

describe('argsMemoize and memoize', () => {
  localTest('passing memoize directly to createSelector', ({ store }) => {
    const state = store.getState()
    const selectorDefault = createSelector(
      (state: RootState) => state.todos,
      todos => todos.map(({ id }) => id),
    )
    const selectorDefaultParametric = createSelector(
      [(state: RootState, id: number) => id, (state: RootState) => state.todos],
      (id, todos) => todos.filter(todo => todo.id === id),
      { memoize: lruMemoize },
    )
    selectorDefaultParametric(state, 0)
    selectorDefaultParametric(state, 1)
    selectorDefaultParametric(state, 1)
    selectorDefaultParametric(deepClone(state), 1)
    selectorDefaultParametric(deepClone(state), 0)
    selectorDefaultParametric(deepClone(state), 0)

    const selectorAutotrack = createSelector(
      (state: RootState) => state.todos,
      todos => todos.map(({ id }) => id),
      { memoize: autotrackMemoize },
    )
    const outPutSelectorFields: (keyof OutputSelectorFields)[] = [
      'memoize',
      'argsMemoize',
      'resultFunc',
      'memoizedResultFunc',
      'lastResult',
      'dependencies',
      'recomputations',
      'resetRecomputations',
      'dependencyRecomputations',
      'resetDependencyRecomputations',
    ]
    const memoizerFields: Exclude<
      keyof OutputSelector,
      keyof OutputSelectorFields
    >[] = ['clearCache', 'resultsCount', 'resetResultsCount']
    const allFields: (keyof OutputSelector)[] = [
      ...outPutSelectorFields,
      ...memoizerFields,
    ]
    const hasUndefinedValues = (object: object) => {
      return Object.values(object).some(e => e == null)
    }
    const isArrayOfFunctions = (array: any[]) =>
      array.every(e => typeof e === 'function')
    expect(selectorDefault).toBeMemoizedSelector()
    expect(selectorDefault)
      .to.be.a('function')
      .that.has.all.keys(allFields)
      .and.satisfies(isMemoizedSelector)
      .and.has.own.property('clearCache')
      .that.is.a('function')
      .with.lengthOf(0)
    expect(selectorAutotrack).to.be.a('function').that.has.all.keys(allFields)
    expect(selectorDefault.resultFunc).to.be.a('function')
    expect(selectorDefault.memoizedResultFunc).to.be.a('function')
    expect(selectorDefault.lastResult).to.be.a('function')
    expect(selectorDefault.dependencies).to.be.an('array').that.is.not.empty
    expect(selectorDefault.recomputations).to.be.a('function')
    expect(selectorDefault.dependencyRecomputations).to.be.a('function')
    expect(selectorDefault.resetRecomputations).to.be.a('function')
    expect(selectorDefault.resetDependencyRecomputations).to.be.a('function')
    expect(selectorDefault.memoize).to.be.a('function')
    expect(selectorDefault.argsMemoize).to.be.a('function')
    expect(selectorDefault.clearCache).to.be.a('function')
    expect(selectorDefault.lastResult()).toBeUndefined()
    expect(selectorAutotrack.lastResult()).toBeUndefined()
    expect(selectorDefault.recomputations()).toBe(0)
    expect(selectorAutotrack.recomputations()).toBe(0)
    expect(selectorDefault(state)).toStrictEqual(selectorAutotrack(state))
    expect(selectorDefault.recomputations()).toBe(1)
    expect(selectorDefault.dependencyRecomputations()).toBe(1)
    expect(selectorAutotrack.recomputations()).toBe(1)
    expect(selectorAutotrack.dependencyRecomputations()).toBe(1)
    // flipping completed flag does not cause the autotrack memoizer to re-run.
    store.dispatch(toggleCompleted(0))
    selectorDefault(store.getState())
    selectorAutotrack(store.getState())
    const defaultSelectorLastResult1 = selectorDefault.lastResult()
    const autotrackSelectorLastResult1 = selectorAutotrack.lastResult()
    store.dispatch(toggleCompleted(0))
    selectorDefault(store.getState())
    selectorAutotrack(store.getState())
    const defaultSelectorLastResult2 = selectorDefault.lastResult()
    const autotrackSelectorLastResult2 = selectorAutotrack.lastResult()
    expect(selectorDefault.recomputations()).toBe(3)
    expect(selectorDefault.dependencyRecomputations()).toBe(3)
    expect(selectorAutotrack.recomputations()).toBe(1)
    expect(selectorAutotrack.dependencyRecomputations()).toBe(3)
    for (let i = 0; i < 10; i++) {
      store.dispatch(toggleCompleted(0))
      selectorDefault(store.getState())
      selectorAutotrack(store.getState())
    }
    expect(selectorDefault.recomputations()).toBe(13)
    expect(selectorDefault.dependencyRecomputations()).toBe(13)
    expect(selectorAutotrack.recomputations()).toBe(1)
    expect(selectorAutotrack.dependencyRecomputations()).toBe(13)
    expect(autotrackSelectorLastResult1).toBe(autotrackSelectorLastResult2)
    expect(defaultSelectorLastResult1).not.toBe(defaultSelectorLastResult2) // Default memoize does not preserve referential equality but autotrack does.
    expect(defaultSelectorLastResult1).toStrictEqual(defaultSelectorLastResult2)
    store.dispatch(
      addTodo({
        title: 'Figure out if plants are really plotting world domination.',
        description: 'They may be.',
      }),
    )
    selectorAutotrack(store.getState())
    expect(selectorAutotrack.recomputations()).toBe(2)
    expect(selectorAutotrack.dependencyRecomputations()).toBe(14)
  })

  localTest('passing argsMemoize directly to createSelector', ({ store }) => {
    const otherCreateSelector = createSelectorCreator({
      memoize: microMemoize,
      argsMemoize: microMemoize,
    })
    const selectorDefault = otherCreateSelector(
      [(state: RootState) => state.todos],
      todos => todos.map(({ id }) => id),
      { memoize: lruMemoize, argsMemoize: lruMemoize },
    )
    const selectorAutotrack = createSelector(
      [(state: RootState) => state.todos],
      todos => todos.map(({ id }) => id),
      { memoize: autotrackMemoize },
    )
    expect(selectorDefault(store.getState())).toStrictEqual(
      selectorAutotrack(store.getState()),
    )
    expect(selectorDefault.recomputations()).toBe(1)
    expect(selectorAutotrack.recomputations()).toBe(1)
    expect(selectorDefault.dependencyRecomputations()).toBe(1)
    expect(selectorAutotrack.dependencyRecomputations()).toBe(1)
    selectorDefault(store.getState())
    selectorAutotrack(store.getState())
    // toggling the completed flag should force the default memoizer to recalculate but not autotrack.
    store.dispatch(toggleCompleted(0))
    selectorDefault(store.getState())
    selectorAutotrack(store.getState())
    store.dispatch(toggleCompleted(1))
    selectorDefault(store.getState())
    selectorAutotrack(store.getState())
    store.dispatch(toggleCompleted(2))
    selectorAutotrack(store.getState())
    selectorAutotrack(store.getState())
    selectorAutotrack(store.getState())
    selectorDefault(store.getState())
    selectorDefault(store.getState())
    selectorDefault(store.getState())
    store.dispatch(toggleCompleted(2))
    expect(selectorDefault.recomputations()).toBe(4)
    expect(selectorAutotrack.recomputations()).toBe(1)
    expect(selectorDefault.dependencyRecomputations()).toBe(4)
    expect(selectorAutotrack.dependencyRecomputations()).toBe(4)
    selectorDefault(store.getState())
    selectorAutotrack(store.getState())
    store.dispatch(toggleCompleted(0))
    const defaultSelectorLastResult1 = selectorDefault.lastResult()
    selectorDefault(store.getState())
    store.dispatch(toggleCompleted(0))
    const defaultSelectorLastResult2 = selectorDefault.lastResult()
    selectorAutotrack(store.getState())
    store.dispatch(toggleCompleted(0))
    const autotrackSelectorLastResult1 = selectorAutotrack.lastResult()
    selectorAutotrack(store.getState())
    store.dispatch(toggleCompleted(0))
    const autotrackSelectorLastResult2 = selectorAutotrack.lastResult()
    expect(selectorDefault.recomputations()).toBe(6)
    expect(selectorAutotrack.recomputations()).toBe(1)
    expect(selectorDefault.dependencyRecomputations()).toBe(6)
    expect(selectorAutotrack.dependencyRecomputations()).toBe(7)
    expect(autotrackSelectorLastResult1).toBe(autotrackSelectorLastResult2)
    expect(defaultSelectorLastResult1).not.toBe(defaultSelectorLastResult2)
    expect(defaultSelectorLastResult1).toStrictEqual(defaultSelectorLastResult2)
    for (let i = 0; i < 10; i++) {
      store.dispatch(toggleCompleted(0))
      selectorAutotrack(store.getState())
    }
    for (let i = 0; i < 10; i++) {
      store.dispatch(toggleCompleted(0))
      selectorDefault(store.getState())
    }
    expect(selectorAutotrack.recomputations()).toBe(1)
    expect(selectorDefault.recomputations()).toBe(16)
    expect(selectorAutotrack.dependencyRecomputations()).toBe(17)
    expect(selectorDefault.dependencyRecomputations()).toBe(16)
    // original options untouched.
    const selectorOriginal = createSelector(
      [(state: RootState) => state.todos],
      todos => todos.map(({ id }) => id),
    )
    selectorOriginal(store.getState())
    const start = performance.now()
    for (let i = 0; i < 1_000_000_0; i++) {
      selectorOriginal(store.getState())
    }
    const totalTime = performance.now() - start
    expect(totalTime).toBeLessThan(1000)
    selectorOriginal(store.getState())
    // Override `argsMemoize` with `autotrackMemoize`
    const selectorOverrideArgsMemoize = createSelector(
      [(state: RootState) => state.todos],
      todos => todos.map(({ id }) => id),
      {
        memoize: lruMemoize,
        // WARNING!! This is just for testing purposes, do not use `autotrackMemoize` to memoize the arguments,
        // it can return false positives, since it's not tracking a nested field.
        argsMemoize: autotrackMemoize,
      },
    )
    selectorOverrideArgsMemoize(store.getState())
    for (let i = 0; i < 10; i++) {
      store.dispatch(toggleCompleted(0))
      selectorOverrideArgsMemoize(store.getState())
      selectorOriginal(store.getState())
    }
    expect(selectorOverrideArgsMemoize.recomputations()).toBe(1)
    expect(selectorOriginal.recomputations()).toBe(11)
    expect(selectorOverrideArgsMemoize.dependencyRecomputations()).toBe(1)
    expect(selectorOriginal.dependencyRecomputations()).toBe(11)
    const selectorDefaultParametric = createSelector(
      [(state: RootState, id: number) => id, (state: RootState) => state.todos],
      (id, todos) => todos.filter(todo => todo.id === id),
    )
    selectorDefaultParametric(store.getState(), 1)
    selectorDefaultParametric(store.getState(), 1)
    expect(selectorDefaultParametric.recomputations()).toBe(1)
    expect(selectorDefaultParametric.dependencyRecomputations()).toBe(1)
    selectorDefaultParametric(store.getState(), 2)
    selectorDefaultParametric(store.getState(), 1)
    expect(selectorDefaultParametric.recomputations()).toBe(2)
    expect(selectorDefaultParametric.dependencyRecomputations()).toBe(2)
    selectorDefaultParametric(store.getState(), 2)
    expect(selectorDefaultParametric.recomputations()).toBe(2)
    expect(selectorDefaultParametric.dependencyRecomputations()).toBe(2)
    const selectorDefaultParametricArgsWeakMap = createSelector(
      [(state: RootState, id: number) => id, (state: RootState) => state.todos],
      (id, todos) => todos.filter(todo => todo.id === id),
      { argsMemoize: weakMapMemoize },
    )
    const selectorDefaultParametricWeakMap = createSelector(
      [(state: RootState, id: number) => id, (state: RootState) => state.todos],
      (id, todos) => todos.filter(todo => todo.id === id),
      { memoize: weakMapMemoize },
    )
    selectorDefaultParametricArgsWeakMap(store.getState(), 1)
    selectorDefaultParametricArgsWeakMap(store.getState(), 1)
    expect(selectorDefaultParametricArgsWeakMap.recomputations()).toBe(1)
    expect(
      selectorDefaultParametricArgsWeakMap.dependencyRecomputations(),
    ).toBe(1)
    selectorDefaultParametricArgsWeakMap(store.getState(), 2)
    selectorDefaultParametricArgsWeakMap(store.getState(), 1)
    expect(selectorDefaultParametricArgsWeakMap.recomputations()).toBe(2)
    expect(
      selectorDefaultParametricArgsWeakMap.dependencyRecomputations(),
    ).toBe(2)
    selectorDefaultParametricArgsWeakMap(store.getState(), 2)
    // If we call the selector with 1, then 2, then 1 and back to 2 again,
    // `lruMemoize` will recompute a total of 4 times,
    // but weakMapMemoize will recompute only twice.
    expect(selectorDefaultParametricArgsWeakMap.recomputations()).toBe(2)
    expect(
      selectorDefaultParametricArgsWeakMap.dependencyRecomputations(),
    ).toBe(2)
    for (let i = 0; i < 10; i++) {
      selectorDefaultParametricArgsWeakMap(store.getState(), 1)
      selectorDefaultParametricArgsWeakMap(store.getState(), 2)
      selectorDefaultParametricArgsWeakMap(store.getState(), 3)
      selectorDefaultParametricArgsWeakMap(store.getState(), 4)
      selectorDefaultParametricArgsWeakMap(store.getState(), 5)
    }
    expect(selectorDefaultParametricArgsWeakMap.recomputations()).toBe(5)
    expect(
      selectorDefaultParametricArgsWeakMap.dependencyRecomputations(),
    ).toBe(5)
    for (let i = 0; i < 10; i++) {
      selectorDefaultParametric(store.getState(), 1)
      selectorDefaultParametric(store.getState(), 2)
      selectorDefaultParametric(store.getState(), 3)
      selectorDefaultParametric(store.getState(), 4)
      selectorDefaultParametric(store.getState(), 5)
    }
    expect(selectorDefaultParametric.recomputations()).toBe(5)
    expect(selectorDefaultParametric.dependencyRecomputations()).toBe(5)
    for (let i = 0; i < 10; i++) {
      selectorDefaultParametricWeakMap(store.getState(), 1)
      selectorDefaultParametricWeakMap(store.getState(), 2)
      selectorDefaultParametricWeakMap(store.getState(), 3)
      selectorDefaultParametricWeakMap(store.getState(), 4)
      selectorDefaultParametricWeakMap(store.getState(), 5)
    }
    expect(selectorDefaultParametricWeakMap.recomputations()).toBe(5)
    expect(selectorDefaultParametricWeakMap.dependencyRecomputations()).toBe(5)
  })

  localTest('passing argsMemoize to createSelectorCreator', ({ store }) => {
    const state = store.getState()
    const createSelectorMicroMemoize = createSelectorCreator({
      memoize: microMemoize,
      memoizeOptions: { isEqual: (a, b) => a === b },
      argsMemoize: microMemoize,
      argsMemoizeOptions: { isEqual: (a, b) => a === b },
    })
    const selectorMicroMemoize = createSelectorMicroMemoize(
      (state: RootState) => state.todos,
      todos => todos.map(({ id }) => id),
    )
    expect(selectorMicroMemoize(state)).to.be.an('array').that.is.not.empty
    // Checking existence of fields related to `argsMemoize`
    expect(selectorMicroMemoize.cache).to.be.an('object')
    expect(selectorMicroMemoize.fn).to.be.a('function')
    expect(selectorMicroMemoize.isMemoized).to.be.true
    expect(selectorMicroMemoize.options).to.be.an('object')
    // @ts-expect-error
    expect(selectorMicroMemoize.clearCache).toBeUndefined()
    expect(selectorMicroMemoize.memoizedResultFunc).to.be.a('function')
    // Checking existence of fields related to `memoize`
    expect(selectorMicroMemoize.memoizedResultFunc.cache).to.be.an('object')
    expect(selectorMicroMemoize.memoizedResultFunc.fn).to.be.a('function')
    expect(selectorMicroMemoize.memoizedResultFunc.isMemoized).to.be.true
    expect(selectorMicroMemoize.memoizedResultFunc.options).to.be.an('object')
    // @ts-expect-error
    expect(selectorMicroMemoize.memoizedResultFunc.clearCache).toBeUndefined()
    // Checking existence of fields related to the actual memoized selector
    expect(selectorMicroMemoize.dependencies).to.be.an('array').that.is.not
      .empty
    expect(selectorMicroMemoize.lastResult()).to.be.an('array').that.is.not
      .empty
    expect(
      selectorMicroMemoize.memoizedResultFunc([
        {
          id: 0,
          completed: true,
          title: 'Practice telekinesis for 15 minutes',
          description: 'Just do it',
        },
      ]),
    ).to.be.an('array').that.is.not.empty
    expect(selectorMicroMemoize.recomputations()).to.be.a('number')
    expect(selectorMicroMemoize.dependencyRecomputations()).to.be.a('number')
    expect(selectorMicroMemoize.resultFunc).to.be.a('function')
    expect(
      selectorMicroMemoize.resultFunc([
        {
          id: 0,
          completed: true,
          title: 'Practice telekinesis for 15 minutes',
          description: 'Just do it',
        },
      ]),
    ).to.be.an('array').that.is.not.empty

    const selectorMicroMemoizeOverridden = createSelectorMicroMemoize(
      [(state: RootState) => state.todos],
      todos => todos.map(({ id }) => id),
      { memoize: lruMemoize, argsMemoize: lruMemoize },
    )
    expect(selectorMicroMemoizeOverridden(state)).to.be.an('array').that.is.not
      .empty
    // Checking existence of fields related to `argsMemoize`
    expect(selectorMicroMemoizeOverridden.clearCache).to.be.a('function')
    // @ts-expect-error
    expect(selectorMicroMemoizeOverridden.cache).toBeUndefined()
    // @ts-expect-error
    expect(selectorMicroMemoizeOverridden.fn).toBeUndefined()
    // @ts-expect-error
    expect(selectorMicroMemoizeOverridden.isMemoized).toBeUndefined()
    // @ts-expect-error
    expect(selectorMicroMemoizeOverridden.options).toBeUndefined()
    // Checking existence of fields related to `memoize`
    expect(
      selectorMicroMemoizeOverridden.memoizedResultFunc.clearCache,
    ).to.be.a('function')
    expect(
      // @ts-expect-error
      selectorMicroMemoizeOverridden.memoizedResultFunc.cache,
    ).toBeUndefined()
    // @ts-expect-error
    expect(selectorMicroMemoizeOverridden.memoizedResultFunc.fn).toBeUndefined()
    expect(
      // @ts-expect-error
      selectorMicroMemoizeOverridden.memoizedResultFunc.isMemoized,
    ).toBeUndefined()
    expect(
      // @ts-expect-error
      selectorMicroMemoizeOverridden.memoizedResultFunc.options,
    ).toBeUndefined()
    // Checking existence of fields related to the actual memoized selector
    expect(selectorMicroMemoizeOverridden.dependencies).to.be.an('array').that
      .is.not.empty
    expect(selectorMicroMemoizeOverridden.lastResult()).to.be.an('array').that
      .is.not.empty
    expect(
      selectorMicroMemoizeOverridden.memoizedResultFunc([
        {
          id: 0,
          completed: true,
          title: 'Practice telekinesis for 15 minutes',
          description: 'Just do it',
        },
      ]),
    ).to.be.an('array').that.is.not.empty
    expect(selectorMicroMemoizeOverridden.recomputations()).to.be.a('number')
    expect(selectorMicroMemoizeOverridden.dependencyRecomputations()).to.be.a(
      'number',
    )
    expect(
      selectorMicroMemoizeOverridden.resultFunc([
        {
          id: 0,
          completed: true,
          title: 'Practice telekinesis for 15 minutes',
          description: 'Just do it',
        },
      ]),
    ).to.be.an('array').that.is.not.empty

    const selectorMicroMemoizeOverrideArgsMemoizeOnly =
      createSelectorMicroMemoize(
        (state: RootState) => state.todos,
        todos => todos.map(({ id }) => id),
        {
          argsMemoize: lruMemoize,
          argsMemoizeOptions: { resultEqualityCheck: (a, b) => a === b },
        },
      )
    expect(selectorMicroMemoizeOverrideArgsMemoizeOnly(state)).to.be.an('array')
      .that.is.not.empty
    // Checking existence of fields related to `argsMemoize`
    expect(selectorMicroMemoizeOverrideArgsMemoizeOnly.clearCache).to.be.a(
      'function',
    )
    // @ts-expect-error
    expect(selectorMicroMemoizeOverrideArgsMemoizeOnly.cache).toBeUndefined()
    // @ts-expect-error
    expect(selectorMicroMemoizeOverrideArgsMemoizeOnly.fn).toBeUndefined()
    expect(
      // @ts-expect-error
      selectorMicroMemoizeOverrideArgsMemoizeOnly.isMemoized,
    ).toBeUndefined()
    // @ts-expect-error
    expect(selectorMicroMemoizeOverrideArgsMemoizeOnly.options).toBeUndefined()
    expect(
      // Checking existence of fields related to `memoize`
      // @ts-expect-error Note that since we did not override `memoize` in the options object,
      // memoizedResultFunc.clearCache becomes an invalid field access, and we get `cache`, `fn`, `isMemoized` and `options` instead.
      selectorMicroMemoizeOverrideArgsMemoizeOnly.memoizedResultFunc.clearCache,
    ).toBeUndefined()
    expect(
      selectorMicroMemoizeOverrideArgsMemoizeOnly.memoizedResultFunc.cache,
    ).to.be.a('object')
    expect(
      selectorMicroMemoizeOverrideArgsMemoizeOnly.memoizedResultFunc.fn,
    ).to.be.a('function')
    expect(
      selectorMicroMemoizeOverrideArgsMemoizeOnly.memoizedResultFunc.isMemoized,
    ).to.be.true
    expect(
      selectorMicroMemoizeOverrideArgsMemoizeOnly.memoizedResultFunc.options,
    ).to.be.a('object')
    // Checking existence of fields related to the actual memoized selector
    expect(selectorMicroMemoizeOverrideArgsMemoizeOnly.dependencies).to.be.an(
      'array',
    ).that.is.not.empty
    expect(selectorMicroMemoizeOverrideArgsMemoizeOnly.lastResult()).to.be.an(
      'array',
    ).that.is.not.empty
    expect(
      selectorMicroMemoizeOverrideArgsMemoizeOnly.memoizedResultFunc([
        {
          id: 0,
          completed: true,
          title: 'Practice telekinesis for 15 minutes',
          description: 'Just do it',
        },
      ]),
    ).to.be.an('array').that.is.not.empty
    expect(
      selectorMicroMemoizeOverrideArgsMemoizeOnly.recomputations(),
    ).to.be.a('number')
    expect(
      selectorMicroMemoizeOverrideArgsMemoizeOnly.dependencyRecomputations(),
    ).to.be.a('number')
    expect(
      selectorMicroMemoizeOverrideArgsMemoizeOnly.resultFunc([
        {
          id: 0,
          completed: true,
          title: 'Practice telekinesis for 15 minutes',
          description: 'Just do it',
        },
      ]),
    ).to.be.an('array').that.is.not.empty

    const selectorMicroMemoizeOverrideMemoizeOnly = createSelectorMicroMemoize(
      [(state: RootState) => state.todos],
      todos => todos.map(({ id }) => id),
      { memoize: lruMemoize },
    )
    expect(selectorMicroMemoizeOverrideMemoizeOnly(state)).to.be.an('array')
      .that.is.not.empty
    // Checking existence of fields related to `argsMemoize`
    // @ts-expect-error Note that since we did not override `argsMemoize` in the options object,
    // selector.clearCache becomes an invalid field access, and we get `cache`, `fn`, `isMemoized` and `options` instead.
    expect(selectorMicroMemoizeOverrideMemoizeOnly.clearCache).toBeUndefined()
    expect(selectorMicroMemoizeOverrideMemoizeOnly).to.have.all.keys([
      'cache',
      'fn',
      'isMemoized',
      'options',
      'resultFunc',
      'memoizedResultFunc',
      'lastResult',
      'dependencies',
      'recomputations',
      'resetRecomputations',
      'memoize',
      'argsMemoize',
      'dependencyRecomputations',
      'resetDependencyRecomputations',
    ])
    expect(selectorMicroMemoizeOverrideMemoizeOnly.cache).to.be.an('object')
    expect(selectorMicroMemoizeOverrideMemoizeOnly.fn).to.be.a('function')
    expect(selectorMicroMemoizeOverrideMemoizeOnly.isMemoized).to.be.true
    expect(selectorMicroMemoizeOverrideMemoizeOnly.options).to.be.an('object')
    // Checking existence of fields related to `memoize`
    expect(selectorMicroMemoizeOverrideMemoizeOnly.memoizedResultFunc)
      .to.be.a('function')
      .that.has.all.keys(['clearCache', 'resultsCount', 'resetResultsCount'])
    expect(
      selectorMicroMemoizeOverrideMemoizeOnly.memoizedResultFunc.clearCache,
    ).to.be.a('function')
    // Checking existence of fields related to the actual memoized selector
    expect(selectorMicroMemoizeOverrideMemoizeOnly.dependencies).to.be.an(
      'array',
    ).that.is.not.empty
    expect(selectorMicroMemoizeOverrideMemoizeOnly.lastResult()).to.be.an(
      'array',
    ).that.is.not.empty
    expect(
      selectorMicroMemoizeOverrideMemoizeOnly.memoizedResultFunc([
        {
          id: 0,
          completed: true,
          title: 'Practice telekinesis for 15 minutes',
          description: 'Just do it',
        },
      ]),
    ).to.be.an('array').that.is.not.empty
    expect(selectorMicroMemoizeOverrideMemoizeOnly.recomputations()).to.be.a(
      'number',
    )
    expect(
      selectorMicroMemoizeOverrideMemoizeOnly.dependencyRecomputations(),
    ).to.be.a('number')
    expect(
      selectorMicroMemoizeOverrideMemoizeOnly.resultFunc([
        {
          id: 0,
          completed: true,
          title: 'Practice telekinesis for 15 minutes',
          description: 'Just do it',
        },
      ]),
    ).to.be.an('array').that.is.not.empty
  })

  localTest(
    'pass options object to createSelectorCreator ',
    ({ store, state }) => {
      const createSelectorMicro = createSelectorCreator({
        memoize: microMemoize,
        memoizeOptions: { isEqual: (a, b) => a === b },
      })
      const selectorMicro = createSelectorMicro(
        [(state: RootState) => state.todos],
        todos => todos.map(({ id }) => id),
      )
      const selector = createSelector(
        [(state: RootState) => state.todos],
        todos => todos.map(({ id }) => id),
      )
      const selector1 = createSelector(
        [(state: RootState) => state.todos],
        todos => todos.map(({ id }) => id),
        { memoize: weakMapMemoize },
      )
      expect(() =>
        //@ts-expect-error
        createSelectorMicro([(state: RootState) => state.todos], 'a'),
      ).toThrowError(
        TypeError(
          `createSelector expects an output function after the inputs, but received: [string]`,
        ),
      )
      const selectorDefault = createSelector(
        (state: RootState) => state.users,
        users => users.user.details.preferences.notifications.push.frequency,
      )
      const selectorDefault1 = createSelector(
        (state: RootState) => state.users.user,
        user => user.details.preferences.notifications.push.frequency,
      )
      let called = 0
      const selectorDefault2 = createSelector(
        (state: RootState) => state.users,
        (state: RootState) => state.users,
        (state: RootState) => state.users,
        (state: RootState) => state.users,
        (state: RootState) => {
          called++
          return state.users
        },
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
        (state: RootState, id: number) => state.users,
        users => {
          return users.user.details.preferences.notifications.push.frequency
        },
        { devModeChecks: { inputStabilityCheck: 'never' } },
      )
      const start = performance.now()
      for (let i = 0; i < 10_000_000; i++) {
        selectorDefault(state)
      }
      expect(performance.now() - start).toBeLessThan(1000)
      selectorDefault1(state)
      const stateBeforeChange = store.getState()
      selectorDefault2(store.getState(), 0)
      const stateBeforeChange1 = store.getState()
      store.dispatch(toggleCompleted(0))
      const stateAfterChange = store.getState()
      expect(stateBeforeChange1).not.toBe(stateAfterChange)
      expect(stateBeforeChange1.alerts).toBe(stateAfterChange.alerts)
      expect(stateBeforeChange1.todos[1]).toBe(stateAfterChange.todos[1])
      expect(stateBeforeChange1).toBe(stateBeforeChange)
      expect(stateBeforeChange1.alerts).toBe(stateBeforeChange.alerts)
    },
  )
})
