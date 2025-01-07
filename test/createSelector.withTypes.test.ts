import { createSelector } from 'reselect'
import type { RootState } from './testUtils'
import { localTest } from './testUtils'

describe(createSelector.withTypes, () => {
  const createTypedSelector = createSelector.withTypes<RootState>()

  localTest('should return createSelector', ({ state }) => {
    expect(createTypedSelector.withTypes).to.be.a('function')

    expect(createTypedSelector.withTypes().withTypes).to.be.a('function')

    expect(createTypedSelector).toBe(createSelector)

    const selectTodoIds = createTypedSelector([state => state.todos], todos =>
      todos.map(({ id }) => id),
    )

    expect(selectTodoIds).toBeMemoizedSelector()

    expect(selectTodoIds(state)).to.be.an('array').that.is.not.empty
  })
})
