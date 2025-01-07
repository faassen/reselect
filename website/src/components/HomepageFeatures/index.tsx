import Heading from '@theme/Heading'
import clsx from 'clsx'
import type { FC, JSX } from 'react'
import { memo } from 'react'
import styles from './styles.module.css'

interface FeatureItem {
  title: string
  description: JSX.Element
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Predictable',
    description: (
      <>
        Like Redux, Reselect gives users a <b>consistent mental model</b> for
        memoizing functions. Extract input values, recalculate when any input
        changes.
      </>
    )
  },
  {
    title: 'Optimized',
    description: (
      <>
        Reselect{' '}
        <b>
          minimizes the number of times expensive computations are performed
        </b>
        , reuses existing result references if nothing has changed, and improves
        performance.
      </>
    )
  },
  {
    title: 'Customizable',
    description: (
      <>
        Reselect comes with fast defaults, but provides{' '}
        <b>flexible customization options</b>. Swap memoization methods, change
        equality checks, and customize for your needs.
      </>
    )
  },
  {
    title: 'Type-Safe',
    description: (
      <>
        Reselect is designed for <b>great TypeScript support</b>. Generated
        selectors infer all types from input selectors.
      </>
    )
  }
]

const Feature: FC<FeatureItem> = memo(({ title, description }) => {
  return (
    <div className={clsx('col col--3')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  )
})

const HomepageFeatures: FC = () => {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default memo(HomepageFeatures)
