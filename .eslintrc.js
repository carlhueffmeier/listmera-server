module.exports = {
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  env: {
    node: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    'no-debugger': 'off',
    'no-return-await': 'error',
    'no-return-assign': 'error',
    'no-throw-literal': 'error',
    'no-new-wrappers': 'error',
    'no-magic-numbers': 'warn',
    strict: ['error', 'global'],
    yoda: 'error',
    curly: 'warn'
  },
  overrides: [
    {
      files: ['__tests__/**'],
      rules: {
        'no-undef': 'off'
      }
    },
    {
      files: ['*.config.js', '*rc.js'],
      rules: {
        strict: 'off'
      }
    }
  ]
};
