// http://eslint.org/docs/rules/
module.exports = {

  env: {
    node: true,
    browser: true,
    es6: true,
    mocha: true
  },

  extends: ['standard', 'plugin:vue/essential'],

  globals: {
    requireSrc: 'writable'
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
  ],

  parserOptions: {
    parser: 'babel-eslint'
  }

}
