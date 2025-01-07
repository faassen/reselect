import { createSelector } from 'reselect'

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

const selectCompletedTodos = (state: RootState) => {
  console.log('selector ran')
  return state.todos.filter(todo => todo.completed === true)
}

selectCompletedTodos(state) // selector ran
selectCompletedTodos(state) // selector ran
selectCompletedTodos(state) // selector ran

const memoizedSelectCompletedTodos = createSelector(
  [(state: RootState) => state.todos],
  todos => {
    console.log('memoized selector ran')
    return todos.filter(todo => todo.completed === true)
  },
)

memoizedSelectCompletedTodos(state) // memoized selector ran
memoizedSelectCompletedTodos(state)
memoizedSelectCompletedTodos(state)

console.log(selectCompletedTodos(state) === selectCompletedTodos(state)) //=> false

console.log(
  memoizedSelectCompletedTodos(state) === memoizedSelectCompletedTodos(state),
) //=> true
