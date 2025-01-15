import * as path from 'node:path'
import { runTransformTest } from '../../transformTestUtils.js'
import transform, { parser } from './index.js'

runTransformTest(
  'convertInputSelectorsToArray',
  transform,
  parser,
  path.join(__dirname, '__testfixtures__'),
)
