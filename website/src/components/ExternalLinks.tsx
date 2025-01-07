import Link from '@docusaurus/Link'
import type { FC, ReactNode } from 'react'
import { memo } from 'react'

interface Props {
  readonly text?: ReactNode
}

export const ExternalLinks = {
  WeakMap: memo(({ text = 'WeakMap' }) => (
    <Link
      to="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap"
      title="WeakMap"
    >
      <code>{text}</code>
    </Link>
  )),
  ReferenceEqualityCheck: memo(({ text = 'Reference Equality Check' }) => (
    <Link
      to="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality"
      title="Reference Equality Check"
    >
      {text}
    </Link>
  )),
  Memoization: memo(({ text = 'memoization' }) => (
    <Link to="https://en.wikipedia.org/wiki/Memoization" title="Memoization">
      {text}
    </Link>
  )),
  IdentityFunction: memo(({ text = 'Identity Function' }) => (
    <Link
      to="https://en.wikipedia.org/wiki/Identity_function"
      title="Identity Function"
    >
      {text}
    </Link>
  )),
  UseMemo: memo(({ text = 'useMemo' }) => (
    <Link
      to="https://react.dev/reference/react/useMemo#usememo"
      title="useMemo"
    >
      <code>{text}</code>
    </Link>
  )),
  ReReselect: memo(({ text = 'Re-reselect' }) => (
    <Link to="https://github.com/toomuchdesign/re-reselect" title="re-reselect">
      {text}
    </Link>
  )),
  Redux: memo(({ text = 'Redux' }) => (
    <Link to="https://redux.js.org" title="Redux">
      {text}
    </Link>
  )),
  React: memo(({ text = 'React' }) => (
    <Link to="https://react.dev" title="React">
      {text}
    </Link>
  )),
  ReactRedux: memo(({ text = 'React-Redux' }) => (
    <Link to="https://react-redux.js.org" title="React-Redux">
      {text}
    </Link>
  )),
  ReduxToolkit: memo(({ text = 'Redux-Toolkit' }) => (
    <Link to="https://redux-toolkit.js.org" title="Redux-Toolkit">
      {text}
    </Link>
  )),
} as const satisfies Record<string, FC<Props>>

export const AllExternalLinks: FC = memo(() => {
  return (
    <ul>
      {Object.values(ExternalLinks).map((ExternalLink, index) => (
        <li key={index}>
          <b>
            <ExternalLink />
          </b>
        </li>
      ))}
    </ul>
  )
})
