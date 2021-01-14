// http://eslint.org/docs/rules/
module.exports = {

  env: {
    node: true,
    browser: true,
    es6: true,
    mocha: true
  },
  extends: ['plugin:vue/essential'],

  globals: {
    requireSrc: 'writable'
  },
  parserOptions: {
    parser: 'babel-eslint'
  },

  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        mocha: true
      }
    }
  ]
}
