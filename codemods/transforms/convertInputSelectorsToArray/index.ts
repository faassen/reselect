import type {
  ASTPath,
  CallExpression,
  Collection,
  Identifier,
  JSCodeshift,
  Transform,
  VariableDeclaration,
  VariableDeclarator,
} from 'jscodeshift'
import type { TestOptions } from 'jscodeshift/src/testUtils.js'

interface NamedFunctionCallExpression extends CallExpression {
  callee: Identifier
}

interface NamedVariableDeclarator extends VariableDeclarator {
  id: Identifier
}

interface NamedVariableDeclaration extends VariableDeclaration {
  declarations: NamedVariableDeclarator[]
}

const CREATE_SELECTOR_CREATOR = 'createSelectorCreator'

const CREATE_SELECTOR = 'createSelector'

const WITH_TYPES = 'withTypes'

const collectSelectorCreators = (j: JSCodeshift, root: Collection) => {
  const isNamedVariableDeclaration = (
    path: ASTPath<VariableDeclaration>,
  ): path is ASTPath<NamedVariableDeclaration> => {
    const [selectorCreatorDeclarator] = path.value.declarations

    return (
      j.VariableDeclarator.check(selectorCreatorDeclarator) &&
      j.Identifier.check(selectorCreatorDeclarator.id)
    )
  }

  return root
    .find(j.VariableDeclaration)
    .filter(isNamedVariableDeclaration)
    .filter(
      namedVariableDeclaration =>
        j.CallExpression.check(
          namedVariableDeclaration.value.declarations[0]?.init,
        ) &&
        j.Identifier.check(
          namedVariableDeclaration.value.declarations[0]?.init.callee,
        ) &&
        namedVariableDeclaration.value.declarations[0].init.callee.name ===
          CREATE_SELECTOR_CREATOR,
    )
}

const collectSelectorCreatorsNames = (j: JSCodeshift, root: Collection) => {
  const selectorCreatorsNames: string[] = [CREATE_SELECTOR]

  const selectorCreators = collectSelectorCreators(j, root)

  selectorCreators.forEach(path => {
    const [namedVariableDeclarator] = path.value.declarations

    if (namedVariableDeclarator) {
      selectorCreatorsNames.push(namedVariableDeclarator.id.name)
    }
  })

  return selectorCreatorsNames
}

const collectSelectorCreatorsNamesWithTypes = (
  j: JSCodeshift,
  root: Collection,
) => {
  const selectorCreatorsNamesWithTypes: string[] = []
  const selectorCreatorsNames = collectSelectorCreatorsNames(j, root)

  root.find(j.VariableDeclarator).forEach(path => {
    const { init, id } = path.value

    if (
      !j.CallExpression.check(init) ||
      !j.Identifier.check(id) ||
      !j.MemberExpression.check(init.callee)
    ) {
      return
    }

    const memberExpression = init.callee

    const { object, property } = memberExpression

    const isWithTypes =
      j.Identifier.check(property) && property.name === WITH_TYPES

    const isDirectSelectorCreator =
      j.Identifier.check(object) && selectorCreatorsNames.includes(object.name)

    const isCreateSelectorCreatorCall =
      j.CallExpression.check(object) &&
      j.Identifier.check(object.callee) &&
      object.callee.name === CREATE_SELECTOR_CREATOR

    if (
      isWithTypes &&
      (isDirectSelectorCreator || isCreateSelectorCreatorCall)
    ) {
      selectorCreatorsNamesWithTypes.push(id.name)
    }
  })

  return selectorCreatorsNamesWithTypes.concat(selectorCreatorsNames)
}

const getIdentifierVariableDeclarator = (
  root: Collection,
  identifier: Identifier,
) => {
  return root.findVariableDeclarators(identifier.name).nodes()[0]
}

const isLastArgumentObject = (
  j: JSCodeshift,
  path: ASTPath<CallExpression>,
) => {
  const lastArgument = path.value.arguments[path.value.arguments.length - 1]

  return j.ObjectExpression.check(lastArgument)
}

const transform: Transform = (fileInfo, api) => {
  const { j } = api

  const root = j(fileInfo.source)

  const isNamedFunctionCallExpression = (
    path: ASTPath<CallExpression>,
  ): path is ASTPath<NamedFunctionCallExpression> => {
    return j.Identifier.check(path.value.callee)
  }

  const allNamedFunctionCallExpressions = root
    .find(j.CallExpression)
    .filter(isNamedFunctionCallExpression)

  const selectorCreatorsNames = collectSelectorCreatorsNamesWithTypes(j, root)

  const isFirstArgumentArray = (path: ASTPath<CallExpression>) => {
    if (path.value.arguments.length < 2) return true

    const [firstArgument] = path.value.arguments

    if (j.ArrayExpression.check(firstArgument)) return true

    if (!j.Identifier.check(firstArgument)) return false

    const firstArgumentVariableDeclarator = getIdentifierVariableDeclarator(
      root,
      firstArgument,
    )

    if (
      firstArgumentVariableDeclarator?.init == null ||
      j.ArrayExpression.check(firstArgumentVariableDeclarator.init)
    ) {
      return true
    }

    const firstArgumentVariableInitializer =
      firstArgumentVariableDeclarator.init

    const isFirstArgumentInitializedWithArray =
      ('expression' in firstArgumentVariableInitializer &&
        typeof firstArgumentVariableInitializer.expression === 'object' &&
        'type' in firstArgumentVariableInitializer.expression &&
        j.ArrayExpression.check(firstArgumentVariableInitializer.expression)) ||
      (j.VariableDeclarator.check(firstArgumentVariableDeclarator) &&
        j.ArrayExpression.check(firstArgumentVariableInitializer))

    if (isFirstArgumentInitializedWithArray) {
      return true
    }

    return false
  }

  const needsToBeTransformed = allNamedFunctionCallExpressions.filter(
    path =>
      selectorCreatorsNames.includes(path.value.callee.name) &&
      !isFirstArgumentArray(path),
  )

  if (needsToBeTransformed.length === 0) {
    return fileInfo.source
  }

  needsToBeTransformed.replaceWith(path => {
    const { arguments: args, callee } = path.value

    const transformedArguments = (
      isLastArgumentObject(j, path)
        ? [
            j.arrayExpression(args.slice(0, -2)),
            args[args.length - 2],
            args[args.length - 1],
          ]
        : [j.arrayExpression(args.slice(0, -1)), args[args.length - 1]]
    ).filter((path): path is NamedFunctionCallExpression => path != null)

    return j.callExpression(j.identifier(callee.name), transformedArguments)
  })

  return root.toSource({
    lineTerminator: '\n',
  })
}

export const parser = 'tsx' satisfies TestOptions['parser']

export default transform
