import CodeBlock from '@theme/CodeBlock'
import TabItem from '@theme/TabItem'
import Tabs from '@theme/Tabs'
import type { FC } from 'react'
import { memo } from 'react'

const PACKAGE_NAME = 'reselect'

const packageManagers = [
  { value: 'npm', label: 'NPM', command: 'install' },
  { value: 'yarn', label: 'Yarn', command: 'add' },
  { value: 'bun', label: 'Bun', command: 'add' },
  { value: 'pnpm', label: 'PNPM', command: 'add' },
] as const

const PackageManagerTabs: FC = () => {
  return (
    <Tabs groupId="packageManagers" defaultValue={packageManagers[0].value}>
      {packageManagers.map(({ value, command, label }) => (
        <TabItem key={value} value={value} label={label}>
          <CodeBlock language="bash">
            {value} {command} {PACKAGE_NAME}
          </CodeBlock>
        </TabItem>
      ))}
    </Tabs>
  )
}

export default memo(PackageManagerTabs)
