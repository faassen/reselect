import type { RootState } from 'createStructuredSelector/modernUseCase'
import { structuredSelector } from 'createStructuredSelector/modernUseCase'
import type { FC } from 'react'
import { useSelector } from 'react-redux'

interface Props {
  id: number
}

const MyComponent: FC<Props> = ({ id }) => {
  const { todos, alerts, todoById } = useSelector((state: RootState) =>
    structuredSelector(state, id),
  )

  return (
    <div>
      Next to do is:
      <h2>{todoById.title}</h2>
      <p>Description: {todoById.description}</p>
      <ul>
        <h3>All other to dos:</h3>
        {todos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  )
}
