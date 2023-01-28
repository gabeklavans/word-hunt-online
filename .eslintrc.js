/* eslint-disable no-undef */
module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    rules: {
        semi: ["warn", "always"],
        curly: 0,
        "@typescript-eslint/no-unused-vars": "warn",
        "prefer-const": "warn",
        "@typescript-eslint/no-non-null-assertion": 1,
        eqeqeq: [1, "smart"],
    },
};
