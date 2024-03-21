import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  EXAMPLES_DIRECTORY,
  getTSConfig,
  hasTSXExtension,
  tsExtensionRegex,
} from './compileExamples'

const placeholderRegex =
  /\{\/\* START: (.*?) \*\/\}([\s\S]*?)\{\/\* END: \1 \*\/\}/g

const collectMarkdownFiles = (
  directory: string,
  files: { path: string; content: string }[] = [],
) => {
  readdirSync(directory, {
    withFileTypes: true,
  }).forEach(entry => {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      collectMarkdownFiles(filePath, files)
    } else if (/\.mdx?$/.test(entry.name)) {
      const content = readFileSync(filePath, 'utf-8')
      if (content.match(placeholderRegex)) {
        files.push({ path: filePath, content })
      }
    }
  })
  return files
}

const insertCodeExamples = (examplesDirectory: string) => {
  const frontMatterRegex = /---\s*[\s\S]*?---/
  const markdownFilesPaths = collectMarkdownFiles('docs')
  markdownFilesPaths.forEach(({ path: markdownFilePath, content }) => {
    const importTabs = content.includes('import Tabs from')
      ? ''
      : `import Tabs from '@theme/Tabs'\n`
    const importTabItem = content.includes('import TabItem from')
      ? ''
      : `import TabItem from '@theme/TabItem'\n`
    content = content.replace(
      frontMatterRegex,
      frontMatter => `${frontMatter}\n${importTabs}${importTabItem}`,
    )

    content = content.replace(
      placeholderRegex,
      (placeholder, tsFileName: string) => {
        const isTSX = hasTSXExtension(tsFileName)

        const tsFileExtension = isTSX ? 'tsx' : 'ts'
        const jsFileExtension = isTSX ? 'jsx' : 'js'

        const jsFileName = tsFileName.replace(
          tsExtensionRegex,
          `.${jsFileExtension}`,
        )

        const tsFilePath = path.join(examplesDirectory, tsFileName)
        const jsFilePath = path.join(
          examplesDirectory,
          getTSConfig(examplesDirectory).compilerOptions.outDir,
          tsFileName.replace(tsExtensionRegex, `.${jsFileExtension}`),
        )

        const tsFileContent = readFileSync(tsFilePath, 'utf-8')
        const jsFileContent = readFileSync(jsFilePath, 'utf-8')

        return `{/* START: ${tsFileName} */}

<Tabs
  groupId='language'
  defaultValue='${tsFileExtension}'
  values={[
    {label: 'TypeScript', value: '${tsFileExtension}'},
    {label: 'JavaScript', value: '${jsFileExtension}'},
  ]}>
  <TabItem value='${tsFileExtension}'>

  \`\`\`${tsFileExtension} title="${tsFileName}"
  ${tsFileContent}
  \`\`\`
  </TabItem>
  <TabItem value='${jsFileExtension}'>

  \`\`\`${jsFileExtension} title="${jsFileName}"
  ${jsFileContent}
  \`\`\`
  </TabItem>
</Tabs>

{/* END: ${tsFileName} */}`
      },
    )
    writeFileSync(markdownFilePath, content)
  })
}

insertCodeExamples(EXAMPLES_DIRECTORY)
