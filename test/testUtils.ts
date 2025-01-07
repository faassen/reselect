import type { AnyFunction, Simplify } from '@internal/types'
import type { PayloadAction } from '@reduxjs/toolkit'
import { combineReducers, configureStore, createSlice } from '@reduxjs/toolkit'
import { test } from 'vitest'
import type { OutputSelector } from 'reselect'

export interface Todo {
  id: number
  title: string
  description: string
  completed: boolean
}

interface Alert {
  id: number
  message: string
  type: string
  read: boolean
}

interface BillingAddress {
  street: string
  city: string
  state: string
  zip: string
}

interface Address extends BillingAddress {
  billing: BillingAddress
}

interface PushNotification {
  enabled: boolean
  frequency: string
}

interface Notifications {
  email: boolean
  sms: boolean
  push: PushNotification
}

interface Preferences {
  newsletter: boolean
  notifications: Notifications
}

interface Login {
  lastLogin: string
  loginCount: number
}

interface UserDetails {
  name: string
  email: string
  address: Address
  preferences: Preferences
}

interface User {
  id: number
  details: UserDetails
  status: string
  login: Login
}

interface AppSettings {
  theme: string
  language: string
}

interface UserState {
  user: User
  appSettings: AppSettings
}

let nextTodoId = 0

// For long arrays
const todoState = [
  {
    id: nextTodoId++,
    title: 'Buy groceries',
    description: 'Milk, bread, eggs, and fruits',
    completed: false
  },
  {
    id: nextTodoId++,
    title: 'Schedule dentist appointment',
    description: 'Check available slots for next week',
    completed: false
  },
  {
    id: nextTodoId++,
    title: 'Convince the cat to get a job',
    description: 'Need extra income for cat treats',
    completed: false
  },
  {
    id: nextTodoId++,
    title: 'Figure out if plants are plotting world domination',
    description: 'That cactus looks suspicious...',
    completed: false
  },
  {
    id: nextTodoId++,
    title: 'Practice telekinesis',
    description: 'Try moving the remote without getting up',
    completed: false
  },
  {
    id: nextTodoId++,
    title: 'Determine location of El Dorado',
    description: 'Might need it for the next vacation',
    completed: false
  },
  {
    id: nextTodoId++,
    title: 'Master the art of invisible potato juggling',
    description: 'Great party trick',
    completed: false
  }
]

export const createTodoItem = () => {
  const id = nextTodoId++
  return {
    id,
    title: `Task ${id}`,
    description: `Description for task ${id}`,
    completed: false
  }
}

export const pushToTodos = (limit: number) => {
  const { length: todoStateLength } = todoState
  // const limit = howMany + todoStateLength
  for (let i = todoStateLength; i < limit; i++) {
    todoState.push(createTodoItem())
  }
}

pushToTodos(200)

const alertState = [
  {
    id: 0,
    message: 'You have an upcoming meeting at 3 PM.',
    type: 'reminder',
    read: false
  },
  {
    id: 1,
    message: 'New software update available.',
    type: 'notification',
    read: false
  },
  {
    id: 3,
    message:
      'The plants have been watered, but keep an eye on that shifty cactus.',
    type: 'notification',
    read: false
  },
  {
    id: 4,
    message:
      'Telekinesis class has been moved to 5 PM. Please do not bring any spoons.',
    type: 'reminder',
    read: false
  },
  {
    id: 5,
    message:
      'Expedition to El Dorado is postponed. The treasure map is being updated.',
    type: 'notification',
    read: false
  },
  {
    id: 6,
    message:
      'Invisible potato juggling championship is tonight. May the best mime win.',
    type: 'reminder',
    read: false
  }
]

// For nested fields tests
const userState: UserState = {
  user: {
    id: 0,
    details: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      address: {
        street: '123 Main St',
        city: 'AnyTown',
        state: 'CA',
        zip: '12345',
        billing: {
          street: '456 Main St',
          city: 'AnyTown',
          state: 'CA',
          zip: '12345'
        }
      },
      preferences: {
        newsletter: true,
        notifications: {
          email: true,
          sms: false,
          push: {
            enabled: true,
            frequency: 'daily'
          }
        }
      }
    },
    status: 'active',
    login: {
      lastLogin: '2023-04-30T12:34:56Z',
      loginCount: 123
    }
  },
  appSettings: {
    theme: 'dark',
    language: 'en-US'
  }
}

const todoSlice = createSlice({
  name: 'todos',
  initialState: todoState,
  reducers: {
    toggleCompleted: (state, action: PayloadAction<number>) => {
      const todo = state.find(todo => todo.id === action.payload)
      if (todo) {
        todo.completed = !todo.completed
      }
    },

    addTodo: (state, action: PayloadAction<Omit<Todo, 'id' | 'completed'>>) => {
      // const newId = state.length > 0 ? state[state.length - 1].id + 1 : 0
      const newId = nextTodoId++
      state.push({
        ...action.payload,
        id: newId,
        completed: false
      })
    },

    removeTodo: (state, action: PayloadAction<number>) => {
      return state.filter(todo => todo.id !== action.payload)
    },

    updateTodo: (state, action: PayloadAction<Todo>) => {
      const index = state.findIndex(todo => todo.id === action.payload.id)
      if (index !== -1) {
        state[index] = action.payload
      }
    },

    clearCompleted: state => {
      return state.filter(todo => !todo.completed)
    }
  }
})

const alertSlice = createSlice({
  name: 'alerts',
  initialState: alertState,
  reducers: {
    markAsRead: (state, action: PayloadAction<number>) => {
      const alert = state.find(alert => alert.id === action.payload)
      if (alert) {
        alert.read = true
      }
    },

    toggleRead: (state, action: PayloadAction<number>) => {
      const alert = state.find(alert => alert.id === action.payload)
      if (alert) {
        alert.read = !alert.read
      }
    },

    addAlert: (state, action: PayloadAction<Omit<Alert, 'id'>>) => {
      const newId = state.length > 0 ? state[state.length - 1].id + 1 : 0
      state.push({
        ...action.payload,
        id: newId
      })
    },

    removeAlert: (state, action: PayloadAction<number>) => {
      return state.filter(alert => alert.id !== action.payload)
    }
  }
})

const userSlice = createSlice({
  name: 'users',
  initialState: userState,
  reducers: {
    setUserName: (state, action: PayloadAction<string>) => {
      state.user.details.name = action.payload
    },

    setUserEmail: (state, action: PayloadAction<string>) => {
      state.user.details.email = action.payload
    },

    setAppTheme: (state, action: PayloadAction<string>) => {
      state.appSettings.theme = action.payload
    },

    updateUserStatus: (state, action: PayloadAction<string>) => {
      state.user.status = action.payload
    },

    updateLoginDetails: (
      state,
      action: PayloadAction<{ lastLogin: string; loginCount: number }>
    ) => {
      state.user.login = { ...state.user.login, ...action.payload }
    },

    updateUserAddress: (state, action: PayloadAction<Address>) => {
      state.user.details.address = {
        ...state.user.details.address,
        ...action.payload
      }
    },

    updateBillingAddress: (state, action: PayloadAction<BillingAddress>) => {
      state.user.details.address.billing = {
        ...state.user.details.address.billing,
        ...action.payload
      }
    },

    toggleNewsletterSubscription: state => {
      state.user.details.preferences.newsletter =
        !state.user.details.preferences.newsletter
    },

    setNotificationPreferences: (
      state,
      action: PayloadAction<Notifications>
    ) => {
      state.user.details.preferences.notifications = {
        ...state.user.details.preferences.notifications,
        ...action.payload
      }
    },

    updateAppLanguage: (state, action: PayloadAction<string>) => {
      state.appSettings.language = action.payload
    }
  }
})

const rootReducer = combineReducers({
  [todoSlice.name]: todoSlice.reducer,
  [alertSlice.name]: alertSlice.reducer,
  [userSlice.name]: userSlice.reducer
})

export const setupStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({ reducer: rootReducer, preloadedState })
}

export type AppStore = Simplify<ReturnType<typeof setupStore>>

export type RootState = ReturnType<typeof rootReducer>

export interface LocalTestContext {
  store: AppStore
  state: RootState
}

export const { markAsRead, addAlert, removeAlert, toggleRead } =
  alertSlice.actions

export const {
  toggleCompleted,
  addTodo,
  removeTodo,
  updateTodo,
  clearCompleted
} = todoSlice.actions

export const { setUserName, setUserEmail, setAppTheme } = userSlice.actions

// Since Node 16 does not support `structuredClone`
export const deepClone = <T extends object>(object: T): T =>
  JSON.parse(JSON.stringify(object))

export const setFunctionName = (func: AnyFunction, name: string) => {
  Object.defineProperty(func, 'name', { value: name })
}

export const setFunctionNames = (funcObject: Record<string, AnyFunction>) => {
  Object.entries(funcObject).forEach(([key, value]) =>
    setFunctionName(value, key)
  )
}

const store = setupStore()
const state = store.getState()

export const localTest = test.extend<LocalTestContext>({
  store,
  state
})

export const resetSelector = <S extends OutputSelector>(selector: S) => {
  selector.clearCache()
  selector.resetRecomputations()
  selector.resetDependencyRecomputations()
  selector.memoizedResultFunc.clearCache()
}

export const logRecomputations = <S extends OutputSelector>(selector: S) => {
  console.log(
    `${selector.name} result function recalculated:`,
    selector.recomputations(),
    `time(s)`,
    `input selectors recalculated:`,
    selector.dependencyRecomputations(),
    `time(s)`
  )
}

export const logSelectorRecomputations = <S extends OutputSelector>(
  selector: S
) => {
  console.log(`\x1B[32m\x1B[1m${selector.name}\x1B[0m:`, {
    resultFunc: selector.recomputations(),
    inputSelectors: selector.dependencyRecomputations(),
    newResults:
      typeof selector.memoizedResultFunc.resultsCount === 'function'
        ? selector.memoizedResultFunc.resultsCount()
        : undefined
  })
  // console.log(
  //   `\x1B[32m\x1B[1m${selector.name}\x1B[0m result function recalculated:`,
  //   `\x1B[33m${selector.recomputations().toLocaleString('en-US')}\x1B[0m`,
  //   'time(s)',
  //   `input selectors recalculated:`,
  //   `\x1B[33m${selector
  //     .dependencyRecomputations()
  //     .toLocaleString('en-US')}\x1B[0m`,
  //   'time(s)'
  // )
}

export const logFunctionInfo = (func: AnyFunction, recomputations: number) => {
  console.log(
    `\x1B[32m\x1B[1m${func.name}\x1B[0m was called:`,
    recomputations,
    'time(s)'
  )
}

export const safeApply = <Params extends any[], Result>(
  func: (...args: Params) => Result,
  args: Params
) => func.apply<null, Params, Result>(null, args)

export const countRecomputations = <
  Params extends any[],
  Result,
  AdditionalFields
>(
  func: ((...args: Params) => Result) & AdditionalFields
) => {
  let recomputations = 0
  const wrapper = (...args: Params) => {
    recomputations++
    return safeApply(func, args)
  }
  return Object.assign(
    wrapper,
    {
      recomputations: () => recomputations,
      resetRecomputations: () => (recomputations = 0)
    },
    func
  )
}

export const runMultipleTimes = <Params extends any[]>(
  func: (...args: Params) => any,
  times: number,
  ...args: Params
) => {
  for (let i = 0; i < times; i++) {
    safeApply(func, args)
  }
}

export const expensiveComputation = (times = 1_000_000) => {
  for (let i = 0; i < times; i++) {
    // Do nothing
  }
}

export const setEnvToProd = () => {
  vi.stubEnv('NODE_ENV', 'production')
  return vi.unstubAllEnvs
}

export const isMemoizedSelector = (selector: object) => {
  return (
    typeof selector === 'function' &&
    'resultFunc' in selector &&
    'memoizedResultFunc' in selector &&
    'lastResult' in selector &&
    'dependencies' in selector &&
    'recomputations' in selector &&
    'dependencyRecomputations' in selector &&
    'resetRecomputations' in selector &&
    'resetDependencyRecomputations' in selector &&
    'memoize' in selector &&
    'argsMemoize' in selector &&
    typeof selector.resultFunc === 'function' &&
    typeof selector.memoizedResultFunc === 'function' &&
    typeof selector.lastResult === 'function' &&
    Array.isArray(selector.dependencies) &&
    typeof selector.recomputations === 'function' &&
    typeof selector.dependencyRecomputations === 'function' &&
    typeof selector.resetRecomputations === 'function' &&
    typeof selector.resetDependencyRecomputations === 'function' &&
    typeof selector.memoize === 'function' &&
    typeof selector.argsMemoize === 'function' &&
    selector.dependencies.length >= 1 &&
    selector.dependencies.every(
      (dependency): dependency is Function => typeof dependency === 'function'
    ) &&
    !selector.lastResult.length &&
    !selector.recomputations.length &&
    !selector.resetRecomputations.length &&
    typeof selector.recomputations() === 'number' &&
    typeof selector.dependencyRecomputations() === 'number'
  )
}
