# convertInputSelectorsToArray

Transforms the usage of Reselect's `createSelector` API by consolidating multiple inline input selector arguments into a single array.

It should work with both JavaScript and TypeScript files.

## Usage

```
npx reselect-codemods convertInputSelectorsToArray path/of/files/ or/some**/*glob.js

# or

yarn global add reselect-codemods
reselect-codemods convertInputSelectorsToArray path/of/files/ or/some**/*glob.js
```

## Local Usage

```
node ./bin/cli.mjs convertInputSelectorsToArray path/of/files/ or/some**/*glob.js
```

## Input / Output

<!--FIXTURES_TOC_START-->

- [separate-inline-arguments.input.ts](#separate-inline-arguments.ts)
- [withTypes.input.ts](#withTypes.ts)

<!--FIXTURES_TOC_END-->

## <!--FIXTURES_CONTENT_START-->

<a id="separate-inline-arguments.ts">**separate-inline-arguments.ts**</a>

**Input** (<small>[separate-inline-arguments.input.ts](transforms\convertInputSelectorsToArray__testfixtures__\separate-inline-arguments.input.ts)</small>):

```ts
import { createSelector } from 'reselect'

export interface RootState {
  todos: { id: number; completed: boolean }[]
  alerts: { id: number; read: boolean }[]
}

const selectTodoById = createSelector(
  (state: RootState) => state.todos,
  (state: RootState, id: number) => id,
  (todos, id) => todos.find(todo => todo.id === id),
)
```

**Output** (<small>[separate-inline-arguments.output.ts](transforms\convertInputSelectorsToArray__testfixtures__\separate-inline-arguments.output.ts)</small>):

```ts
import { createSelector } from 'reselect'

export interface RootState {
  todos: { id: number; completed: boolean }[]
  alerts: { id: number; read: boolean }[]
}

const selectTodoById = createSelector(
  [(state: RootState) => state.todos, (state: RootState, id: number) => id],
  (todos, id) => todos.find(todo => todo.id === id),
)
```

<!--FIXTURES_CONTENT_END-->
