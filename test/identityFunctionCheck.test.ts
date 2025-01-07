import { createSelector, setGlobalDevModeChecks } from 'reselect'
import type { RootState } from './testUtils'
import { localTest } from './testUtils'

describe('identityFunctionCheck', () => {
  const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const identityFunction = vi.fn(<T>(state: T) => state)
  let badSelector = createSelector(
    [(state: RootState) => state],
    identityFunction
  )

  afterEach(() => {
    consoleSpy.mockClear()
    identityFunction.mockClear()
    badSelector = createSelector(
      [(state: RootState) => state],
      identityFunction
    )
  })
  afterAll(() => {
    consoleSpy.mockRestore()
  })
  localTest(
    'calls the result function twice, and warns to console if result is the same as argument',
    ({ state }) => {
      const goodSelector = createSelector(
        [(state: RootState) => state],
        state => state.todos
      )

      expect(goodSelector(state)).toBe(state.todos)

      expect(consoleSpy).not.toHaveBeenCalled()

      expect(badSelector(state)).toBe(state)

      expect(identityFunction).toHaveBeenCalledTimes(2)

      expect(consoleSpy).toHaveBeenCalledOnce()
    }
  )

  localTest('includes stack with warning', ({ state }) => {
    expect(badSelector(state)).toBe(state)

    expect(identityFunction).toHaveBeenCalledTimes(2)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'The result function returned its own inputs without modification'
      ),
      {
        stack: expect.any(String)
      }
    )
  })

  localTest('disables check if global setting is set to never', ({ state }) => {
    setGlobalDevModeChecks({ identityFunctionCheck: 'never' })

    expect(badSelector(state)).toBe(state)

    expect(identityFunction).toHaveBeenCalledOnce()

    expect(consoleSpy).not.toHaveBeenCalled()

    setGlobalDevModeChecks({ identityFunctionCheck: 'once' })
  })

  localTest(
    'disables check if specified in the selector options',
    ({ state }) => {
      const badSelector = createSelector(
        [(state: RootState) => state],
        identityFunction,
        { devModeChecks: { identityFunctionCheck: 'never' } }
      )

      expect(badSelector(state)).toBe(state)

      expect(identityFunction).toHaveBeenCalledOnce()

      expect(consoleSpy).not.toHaveBeenCalled()
    }
  )

  localTest('disables check in production', ({ state }) => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    expect(badSelector(state)).toBe(state)

    expect(identityFunction).toHaveBeenCalledOnce()

    expect(consoleSpy).not.toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv
  })

  localTest('allows running the check only once', ({ state }) => {
    const badSelector = createSelector(
      [(state: RootState) => state],
      identityFunction,
      { devModeChecks: { identityFunctionCheck: 'once' } }
    )
    expect(badSelector(state)).toBe(state)

    expect(identityFunction).toHaveBeenCalledTimes(2)

    expect(consoleSpy).toHaveBeenCalledOnce()

    const newState = { ...state }

    expect(badSelector(newState)).toBe(newState)

    expect(identityFunction).toHaveBeenCalledTimes(3)

    expect(consoleSpy).toHaveBeenCalledOnce()
  })

  localTest('allows always running the check', () => {
    const badSelector = createSelector([state => state], identityFunction, {
      devModeChecks: { identityFunctionCheck: 'always' }
    })

    const state = {}

    expect(badSelector(state)).toBe(state)

    expect(identityFunction).toHaveBeenCalledTimes(2)

    expect(consoleSpy).toHaveBeenCalledOnce()

    expect(badSelector({ ...state })).toStrictEqual(state)

    expect(identityFunction).toHaveBeenCalledTimes(4)

    expect(consoleSpy).toHaveBeenCalledTimes(2)

    expect(badSelector(state)).toBe(state)

    expect(identityFunction).toHaveBeenCalledTimes(4)

    expect(consoleSpy).toHaveBeenCalledTimes(2)
  })

  localTest('runs once when devModeChecks is an empty object', ({ state }) => {
    const badSelector = createSelector(
      [(state: RootState) => state],
      identityFunction,
      { devModeChecks: {} }
    )
    expect(badSelector(state)).toBe(state)

    expect(identityFunction).toHaveBeenCalledTimes(2)

    expect(consoleSpy).toHaveBeenCalledOnce()

    const newState = { ...state }

    expect(badSelector(newState)).toBe(newState)

    expect(identityFunction).toHaveBeenCalledTimes(3)

    expect(consoleSpy).toHaveBeenCalledOnce()
  })

  localTest('uses the memoize provided', ({ state }) => {
    const badSelector = createSelector(
      [(state: RootState) => state.todos],
      identityFunction
    )
    expect(badSelector(state)).toBe(state.todos)

    expect(identityFunction).toHaveBeenCalledTimes(2)

    expect(consoleSpy).toHaveBeenCalledOnce()

    expect(badSelector({ ...state })).not.toBe(state)

    expect(consoleSpy).toHaveBeenCalledOnce()
  })

  localTest(
    'does not warn if result function is not identity function (case 1)',
    ({ state }) => {
      // This test demonstrates why in some cases it can be useful to compare the first argument of the result
      // function with the returned value (and not just checking for an identity function by passing `{}` to the result
      // function).
      const getFirstAlertIfMessageIsEmpty = createSelector(
        [(state: RootState) => state.alerts[0]],
        firstAlert => (!firstAlert.message ? firstAlert : null)
      )

      expect(getFirstAlertIfMessageIsEmpty(state)).toBeNull()

      expect(consoleSpy).not.toHaveBeenCalled()
    }
  )

  localTest(
    'does not warn if result function is not identity function (case 2)',
    ({ state }) => {
      // This test demonstrates why in some cases it can be useful to pass `{}` into the result function and compare it
      // with the returned value (and not just checking for an identity function by passing the first argument to the
      // result function).
      const getFirstAlertIfMessageIsNotEmpty = createSelector(
        [(state: RootState) => state.alerts[0]],
        firstAlert => (firstAlert.message ? firstAlert : null)
      )

      expect(getFirstAlertIfMessageIsNotEmpty(state)).toBe(state.alerts[0])

      expect(consoleSpy).not.toHaveBeenCalled()
    }
  )

  localTest(
    'does not warn if result function is passed more than one argument',
    ({ state }) => {
      const getAllNotificationsIfSmsNotEnabled = createSelector(
        [
          (state: RootState) => state.alerts,
          (state: RootState) =>
            state.users.user.details.preferences.notifications.sms
        ],
        (alerts, smsEnabled) => (!smsEnabled ? alerts : [])
      )

      expect(getAllNotificationsIfSmsNotEnabled(state)).toBe(state.alerts)

      expect(consoleSpy).not.toHaveBeenCalled()
    }
  )
})
