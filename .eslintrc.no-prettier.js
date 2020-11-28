// This configuration attempts to duplicate the USDR rules for Prettier for
// people who prefer not to install the SulimeText Prettier plugin.

// http://eslint.org/docs/rules/
module.exports = {

  env: {
    node: true,
    browser: true,
    es6: true,
    mocha: true,
  },
  extends: ["plugin:vue/essential", "eslint:recommended"],

  globals: {
    requireSrc: "writable"
  },
  parserOptions: {
    parser: "babel-eslint"
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-var": "error",

    "semi": ['error','always'],
    "array-bracket-spacing": [ 'error', 'never'],
    "quotes":['error','double', {
      "allowTemplateLiterals": true,
      "avoidEscape": true
    }],
    "max-len": [ 'error', 85 ],
    "object-curly-spacing": [ 'error', 'always' ],
    "arrow-parens":['error', 'as-needed'],
    "comma-style": ['error', 'last'],
    "comma-dangle": ["error", {
        "arrays": "never",
        "objects": "never",
        "imports": "never",
        "exports": "never",
        "functions": "never"
    }]
  },
  overrides: [
    {
      files: [
        "**/__tests__/*.{j,t}s?(x)",
        "**/tests/unit/**/*.spec.{j,t}s?(x)"
      ],
      env: {
        mocha: true
      }
    }
  ],
}
