import microMemoize from 'micro-memoize'
import { createSelector, lruMemoize } from 'reselect'
import { describe, test } from 'vitest'

interface RootState {
  todos: {
    id: number
    completed: boolean
  }[]
}

const state: RootState = {
  todos: [
    { id: 0, completed: false },
    { id: 1, completed: false },
  ],
}

describe('deep nesting', () => {
  test('Deep Nesting First And Second createSelector Overload', () => {
    type State = { foo: string }
    const readOne = (state: State) => state.foo

    const selector0 = createSelector(readOne, one => one)
    const selector1 = createSelector(selector0, s => s)
    const selector2 = createSelector(selector1, s => s)
    const selector3 = createSelector(selector2, s => s)
    const selector4 = createSelector(selector3, s => s)
    const selector5 = createSelector(selector4, s => s)
    const selector6 = createSelector(selector5, s => s)
    const selector7 = createSelector(selector6, s => s)
    const selector8 = createSelector(selector7, s => s)
    const selector9 = createSelector(selector8, s => s)
    const selector10 = createSelector(selector9, s => s, {
      memoize: microMemoize,
    })
    selector10.dependencies[0].dependencies[0].dependencies[0].dependencies[0]
      .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
      .dependencies[0].dependencies[0].memoizedResultFunc.clearCache
    const selector11 = createSelector(selector10, s => s)
    const selector12 = createSelector(selector11, s => s)
    const selector13 = createSelector(selector12, s => s)
    const selector14 = createSelector(selector13, s => s)
    const selector15 = createSelector(selector14, s => s)
    const selector16 = createSelector(selector15, s => s)
    const selector17 = createSelector(selector16, s => s)
    const selector18 = createSelector(selector17, s => s)
    const selector19 = createSelector(selector18, s => s)
    const selector20 = createSelector(selector19, s => s)
    selector20.dependencies[0].dependencies[0].dependencies[0].dependencies[0]
      .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
      .dependencies[0].dependencies[0].memoizedResultFunc.cache
    const selector21 = createSelector(selector20, s => s)
    const selector22 = createSelector(selector21, s => s)
    const selector23 = createSelector(selector22, s => s)
    const selector24 = createSelector(selector23, s => s)
    const selector25 = createSelector(selector24, s => s)
    const selector26 = createSelector(selector25, s => s)
    const selector27 = createSelector(selector26, s => s)
    const selector28 = createSelector(selector27, s => s)
    const selector29 = createSelector(selector28, s => s)
    const selector30 = createSelector(selector29, s => s)
    selector30.dependencies[0].dependencies[0].dependencies[0].dependencies[0]
      .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
      .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
      .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
      .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
      .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
      .dependencies[0].dependencies[0].dependencies[0].dependencies[0]
      .dependencies[0].dependencies[0].memoizedResultFunc.clearCache
  })
  test('Deep Nesting Second createSelector Overload', () => {
    type State = { foo: string }
    const readOne = (state: State) => state.foo

    const selector0 = createSelector(readOne, one => one)
    const selector1 = createSelector(selector0, s => s, {
      memoize: lruMemoize,
    })
    const selector2 = createSelector(selector1, s => s, {
      memoize: lruMemoize,
    })
    const selector3 = createSelector(selector2, s => s, {
      memoize: lruMemoize,
    })
    const selector4 = createSelector(selector3, s => s, {
      memoize: lruMemoize,
    })
    const selector5 = createSelector(selector4, s => s, {
      memoize: lruMemoize,
    })
    const selector6 = createSelector(selector5, s => s, {
      memoize: lruMemoize,
    })
    const selector7 = createSelector(selector6, s => s, {
      memoize: lruMemoize,
    })
    const selector8 = createSelector(selector7, s => s, {
      memoize: lruMemoize,
    })
    const selector9 = createSelector(selector8, s => s, {
      memoize: lruMemoize,
    })
    const selector10 = createSelector(selector9, s => s, {
      memoize: lruMemoize,
    })
    const selector11 = createSelector(selector10, s => s, {
      memoize: lruMemoize,
    })
    const selector12 = createSelector(selector11, s => s, {
      memoize: lruMemoize,
    })
    const selector13 = createSelector(selector12, s => s, {
      memoize: lruMemoize,
    })
    const selector14 = createSelector(selector13, s => s, {
      memoize: lruMemoize,
    })
    const selector15 = createSelector(selector14, s => s, {
      memoize: lruMemoize,
    })
    const selector16 = createSelector(selector15, s => s, {
      memoize: lruMemoize,
    })
    const selector17 = createSelector(selector16, s => s, {
      memoize: lruMemoize,
    })
    const selector18 = createSelector(selector17, s => s, {
      memoize: lruMemoize,
    })
    const selector19 = createSelector(selector18, s => s, {
      memoize: lruMemoize,
    })
    const selector20 = createSelector(selector19, s => s, {
      memoize: lruMemoize,
    })
    const selector21 = createSelector(selector20, s => s, {
      memoize: lruMemoize,
    })
    const selector22 = createSelector(selector21, s => s, {
      memoize: lruMemoize,
    })
    const selector23 = createSelector(selector22, s => s, {
      memoize: lruMemoize,
    })
    const selector24 = createSelector(selector23, s => s, {
      memoize: lruMemoize,
    })
    const selector25 = createSelector(selector24, s => s, {
      memoize: lruMemoize,
    })
    const selector26 = createSelector(selector25, s => s, {
      memoize: lruMemoize,
    })
    const selector27 = createSelector(selector26, s => s, {
      memoize: lruMemoize,
    })
    const selector28 = createSelector(selector27, s => s, {
      memoize: lruMemoize,
    })
    const selector29 = createSelector(selector28, s => s, {
      memoize: lruMemoize,
    })
  })

  test('Deep Nesting Third createSelector Overload', () => {
    type State = { foo: string }
    const readOne = (state: State) => state.foo

    const selector0 = createSelector(readOne, one => one)
    const selector1 = createSelector([selector0], s => s)
    const selector2 = createSelector([selector1], s => s)
    const selector3 = createSelector([selector2], s => s)
    const selector4 = createSelector([selector3], s => s)
    const selector5 = createSelector([selector4], s => s)
    const selector6 = createSelector([selector5], s => s)
    const selector7 = createSelector([selector6], s => s)
    const selector8 = createSelector([selector7], s => s)
    const selector9 = createSelector([selector8], s => s)
    const selector10 = createSelector([selector9], s => s)
    const selector11 = createSelector([selector10], s => s)
    const selector12 = createSelector([selector11], s => s)
    const selector13 = createSelector([selector12], s => s)
    const selector14 = createSelector([selector13], s => s)
    const selector15 = createSelector([selector14], s => s)
    const selector16 = createSelector([selector15], s => s)
    const selector17 = createSelector([selector16], s => s)
    const selector18 = createSelector([selector17], s => s)
    const selector19 = createSelector([selector18], s => s)
    const selector20 = createSelector([selector19], s => s)
    const selector21 = createSelector([selector20], s => s)
    const selector22 = createSelector([selector21], s => s)
    const selector23 = createSelector([selector22], s => s)
    const selector24 = createSelector([selector23], s => s)
    const selector25 = createSelector([selector24], s => s)
    const selector26 = createSelector([selector25], s => s)
    const selector27 = createSelector([selector26], s => s)
    const selector28 = createSelector([selector27], s => s)
    const selector29 = createSelector([selector28], s => s)
    const selector30 = createSelector([selector29], s => s)
  })

  test('createSelector Parameter Limit', () => {
    const selector = createSelector(
      (state: { testString: string }) => state.testString,
      (state: { testNumber: number }) => state.testNumber,
      (state: { testBoolean: boolean }) => state.testBoolean,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testNumber: number }) => state.testNumber,
      (state: { testStringArray: string[] }) => state.testStringArray,
      (state: { testString: string }) => state.testString,
      (state: { testNumber: number }) => state.testNumber,
      (state: { testBoolean: boolean }) => state.testBoolean,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testNumber: number }) => state.testNumber,
      (state: { testStringArray: string[] }) => state.testStringArray,
      (state: { testString: string }) => state.testString,
      (state: { testNumber: number }) => state.testNumber,
      (state: { testBoolean: boolean }) => state.testBoolean,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testNumber: number }) => state.testNumber,
      (state: { testStringArray: string[] }) => state.testStringArray,
      (state: { testString: string }) => state.testString,
      (state: { testNumber: number }) => state.testNumber,
      (state: { testBoolean: boolean }) => state.testBoolean,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testString: string }) => state.testString,
      (state: { testNumber: number }) => state.testNumber,
      (state: { testStringArray: string[] }) => state.testStringArray,
      (
        foo1: string,
        foo2: number,
        foo3: boolean,
        foo4: string,
        foo5: string,
        foo6: string,
        foo7: string,
        foo8: number,
        foo9: string[],
        foo10: string,
        foo11: number,
        foo12: boolean,
        foo13: string,
        foo14: string,
        foo15: string,
        foo16: string,
        foo17: number,
        foo18: string[],
        foo19: string,
        foo20: number,
        foo21: boolean,
        foo22: string,
        foo23: string,
        foo24: string,
        foo25: string,
        foo26: number,
        foo27: string[],
        foo28: string,
        foo29: number,
        foo30: boolean,
        foo31: string,
        foo32: string,
        foo33: string,
        foo34: string,
        foo35: number,
        foo36: string[],
      ) => {
        return {
          foo1,
          foo2,
          foo3,
          foo4,
          foo5,
          foo6,
          foo7,
          foo8,
          foo9,
          foo10,
          foo11,
          foo12,
          foo13,
          foo14,
          foo15,
          foo16,
          foo17,
          foo18,
          foo19,
          foo20,
          foo21,
          foo22,
          foo23,
          foo24,
          foo25,
          foo26,
          foo27,
          foo28,
          foo29,
          foo30,
          foo31,
          foo32,
          foo33,
          foo34,
          foo35,
          foo36,
        }
      },
    )
  })
})
