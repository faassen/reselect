import { createSelector, lruMemoize } from 'reselect'
import type { StateA, StateAB } from './testTypes'

describe('createSelector exposed utils', () => {
  test('resetRecomputations', () => {
    const selector = createSelector(
      (state: StateA) => state.a,
      a => a,
      {
        memoize: lruMemoize,
        argsMemoize: lruMemoize,
        devModeChecks: { identityFunctionCheck: 'never' }
      }
    )
    expect(selector({ a: 1 })).toBe(1)
    expect(selector({ a: 1 })).toBe(1)
    expect(selector.recomputations()).toBe(1)
    expect(selector({ a: 2 })).toBe(2)
    expect(selector.recomputations()).toBe(2)

    selector.resetRecomputations()
    expect(selector.recomputations()).toBe(0)

    expect(selector({ a: 1 })).toBe(1)
    expect(selector({ a: 1 })).toBe(1)
    expect(selector.recomputations()).toBe(1)
    expect(selector({ a: 2 })).toBe(2)
    expect(selector.recomputations()).toBe(2)
  })

  test('export last function as resultFunc', () => {
    const lastFunction = () => {}
    const selector = createSelector((state: StateA) => state.a, lastFunction)
    expect(selector.resultFunc).toBe(lastFunction)
  })

  test('export dependencies as dependencies', () => {
    const dependency1 = (state: StateA) => {
      state.a
    }
    const dependency2 = (state: StateA) => {
      state.a
    }

    const selector = createSelector(dependency1, dependency2, () => {})
    expect(selector.dependencies).toEqual([dependency1, dependency2])
  })

  test('export lastResult function', () => {
    const selector = createSelector(
      (state: StateAB) => state.a,
      (state: StateAB) => state.b,
      (a, b) => a + b
    )

    const result = selector({ a: 1, b: 2 })
    expect(result).toBe(3)
    expect(selector.lastResult()).toBe(3)
  })
})
