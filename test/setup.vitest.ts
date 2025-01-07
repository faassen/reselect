import { isMemoizedSelector } from './testUtils'

expect.extend({
  toBeMemoizedSelector(received) {
    const { isNot } = this

    return {
      pass: isMemoizedSelector(received),
      message: () => `${received} is${isNot ? '' : ' not'} a memoized selector`,
    }
  },
})
