import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import { config, configs, parser } from 'typescript-eslint'

const ESLintConfig = config(
  { name: 'ignores', ignores: ['**/dist/', '**/__testfixtures__/'] },
  { name: 'javascript', ...js.configs.recommended },
  ...configs.recommended,
  ...configs.stylistic,
  { name: 'prettier-config', ...prettierConfig },
  {
    name: 'main',
    languageOptions: {
      parser,
      parserOptions: {
        projectService: {
          defaultProject: './tsconfig.json',
        },
        ecmaVersion: 'latest',
      },
    },
    rules: {
      'no-undef': [0],
      '@typescript-eslint/consistent-type-imports': [
        2,
        { fixStyle: 'separate-type-imports', disallowTypeAnnotations: false },
      ],
      '@typescript-eslint/consistent-type-exports': [2],
      '@typescript-eslint/no-unused-vars': [0],
      '@typescript-eslint/no-explicit-any': [0],
      '@typescript-eslint/no-empty-object-type': [
        2,
        { allowInterfaces: 'with-single-extends' },
      ],
      '@typescript-eslint/no-namespace': [
        2,
        { allowDeclarations: true, allowDefinitionFiles: true },
      ],
      '@typescript-eslint/ban-ts-comment': [0],
      'sort-imports': [
        2,
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: true,
        },
      ],
    },
    linterOptions: { reportUnusedDisableDirectives: 2 },
  },
  {
    name: 'commonjs',
    files: ['**/*.c[jt]s'],
    languageOptions: { sourceType: 'commonjs' },
    rules: {
      '@typescript-eslint/no-require-imports': [0],
    },
  },
)

export default ESLintConfig
