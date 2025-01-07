import lodashMemoize from 'lodash/memoize'
import memoizeOne from 'memoize-one'
import microMemoize from 'micro-memoize'
import {
  createSelectorCreator,
  lruMemoize,
  unstable_autotrackMemoize as autotrackMemoize,
  weakMapMemoize,
} from 'reselect'
import { describe, test } from 'vitest'

interface RootState {
  todos: { id: number; completed: boolean }[]
  alerts: { id: number; read: boolean }[]
}

const state: RootState = {
  todos: [
    { id: 0, completed: false },
    { id: 1, completed: true },
  ],
  alerts: [
    { id: 0, read: false },
    { id: 1, read: true },
  ],
}

describe('createSelectorCreator', () => {
  test('options object as argument', () => {
    const createSelectorDefault = createSelectorCreator({
      memoize: lruMemoize,
    })
    const createSelectorWeakMap = createSelectorCreator({
      memoize: weakMapMemoize,
    })
    const createSelectorAutotrack = createSelectorCreator({
      memoize: autotrackMemoize,
    })
    const createSelectorMicro = createSelectorCreator({
      memoize: microMemoize,
    })
    const createSelectorOne = createSelectorCreator({
      memoize: memoizeOne,
    })
    const createSelectorLodash = createSelectorCreator({
      memoize: lodashMemoize,
    })
  })

  test('memoize function as argument', () => {
    const createSelectorDefault = createSelectorCreator(lruMemoize)
    const createSelectorWeakMap = createSelectorCreator(weakMapMemoize)
    const createSelectorAutotrack = createSelectorCreator(autotrackMemoize)
    const createSelectorMicro = createSelectorCreator(microMemoize)
    const createSelectorOne = createSelectorCreator(memoizeOne)
    const createSelectorLodash = createSelectorCreator(lodashMemoize)
  })
})
