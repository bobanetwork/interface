/* eslint-env node */

require('@uniswap/eslint-config/load')

module.exports = {
  extends: '@uniswap/eslint-config/react',
  plugins: ['unused-imports'],
  rules: {
    'import/no-unused-modules': ['error', { unusedExports: true }],
    'unused-imports/no-unused-imports': 'error',
  },
}


