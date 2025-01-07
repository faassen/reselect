import { createStructuredSelector } from 'reselect'
import type { RootState } from './testUtils'
import { localTest } from './testUtils'

describe(createStructuredSelector.withTypes, () => {
  const createTypedStructuredSelector =
    createStructuredSelector.withTypes<RootState>()

  localTest('should return createStructuredSelector', ({ state }) => {
    expect(createTypedStructuredSelector.withTypes).to.be.a('function')

    expect(createTypedStructuredSelector.withTypes().withTypes).to.be.a(
      'function',
    )

    expect(createTypedStructuredSelector).toBe(createStructuredSelector)

    const structuredSelector = createTypedStructuredSelector({
      todos: state => state.todos,
      alerts: state => state.alerts,
    })

    expect(structuredSelector).toBeMemoizedSelector()

    expect(structuredSelector(state)).to.be.an('object').that.is.not.empty
  })
})
