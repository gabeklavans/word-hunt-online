/* eslint-disable no-undef */
module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    rules: {
        semi: ["error", "always"],
        curly: 0,
        "@typescript-eslint/no-unused-vars": 2,
        "@typescript-eslint/no-non-null-assertion": 1,
    },
};
