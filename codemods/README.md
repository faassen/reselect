# Reselect Codemods

A collection of codemods for updating legacy Reselect API usage patterns to modern patterns.

## Usage

To run a specific codemod from this project, you would run the following:

```bash
npx reselect-codemods <TRANSFORM NAME> path/of/files/ or/some**/*glob.js

# or

yarn global add reselect-codemods
reselect-codemods <TRANSFORM NAME> path/of/files/ or/some**/*glob.js
```

## Local Usage

```
node ./bin/cli.mjs <TRANSFORM NAME> path/of/files/ or/some**/*glob.js
```

## Transforms

<!--TRANSFORMS_START-->

- [convertInputSelectorsToArray](transforms/convertInputSelectorsToArray/README.md)

<!--TRANSFORMS_END-->

## Contributing

### Installation

- clone the repo
- change into the repo directory
- `yarn`

### Running tests

- `yarn test`
