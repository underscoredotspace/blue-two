module.exports = {
    extends: [
        "eslint:recommended",
        "prettier",
        "prettier/@typescript-eslint",
        "plugin:@typescript-eslint/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module",
    },
    plugins: ["@typescript-eslint", "jest"],
    env: {
        node: true,
        es6: true,
    },
    rules: {
        "no-irregular-whitespace": ["error", { skipTemplates: true }],
        "@typescript-eslint/no-unused-vars": [
            "warn",
            {
                vars: "all",
                args: "after-used",
                ignoreRestSiblings: true,
                argsIgnorePattern: "^_",
            },
        ],
        "@typescript-eslint/camelcase": "off",
        "@typescript-eslint/no-explicit-any": "off",
    },
};