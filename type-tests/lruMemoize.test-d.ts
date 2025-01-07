import type { AnyFunction } from '@internal/types'
import { groupBy, isEqual } from 'lodash'
import {
  createSelectorCreator,
  lruMemoize,
  referenceEqualityCheck
} from 'reselect'

describe('type tests', () => {
  test('lruMemoize', () => {
    const func = (a: string) => +a

    const memoized = lruMemoize(func)

    expectTypeOf(memoized('42')).toBeNumber()

    expectTypeOf(memoized('42')).not.toBeString()

    const memoized2 = lruMemoize(
      (str: string, arr: string[]): { str: string; arr: string[] } => ({
        str,
        arr
      }),
      <T>(a: T, b: T) => {
        return `${a}` === `${b}`
      }
    )

    const ret2 = memoized2('', ['1', '2'])

    expectTypeOf(ret2.str).toBeString()

    expectTypeOf(ret2.arr).items.toBeString()
  })

  test('issue #384', () => {
    // https://github.com/reduxjs/reselect/issues/384

    function multiArgMemoize<F extends AnyFunction>(
      func: F,
      a: number,
      b: string,
      equalityCheck = referenceEqualityCheck
    ): F {
      return func
    }

    interface Transaction {
      transactionId: string
    }

    const toId = (transaction: Transaction) => transaction.transactionId

    const transactionsIds = (transactions: Transaction[]) =>
      transactions.map(toId)

    const collectionsEqual = (ts1: Transaction[], ts2: Transaction[]) =>
      isEqual(transactionsIds(ts1), transactionsIds(ts2))

    expectTypeOf(createSelectorCreator).toBeCallableWith(
      lruMemoize,
      collectionsEqual
    )

    const createMultiMemoizeArgSelector = createSelectorCreator(
      multiArgMemoize,
      42,
      'abcd',
      referenceEqualityCheck
    )

    const select = createMultiMemoizeArgSelector(
      (state: { foo: string }) => state.foo,
      foo => `${foo}!`
    )

    // error is not applicable anymore
    expectTypeOf(select.clearCache).toBeFunction()

    const createMultiMemoizeArgSelector2 = createSelectorCreator(
      multiArgMemoize,
      42,
      // @ts-expect-error
      referenceEqualityCheck
    )

    expectTypeOf(lruMemoize).toBeCallableWith(
      (transactions: Transaction[]) =>
        groupBy(transactions, item => item.transactionId),
      collectionsEqual
    )
  })
})
