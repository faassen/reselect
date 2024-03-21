import { createSelectorCreator } from 'reselect'

const identity = <Func extends (...args: any[]) => any>(func: Func) => func

const createNonMemoizedSelector = createSelectorCreator({
  memoize: identity,
  argsMemoize: identity,
})
