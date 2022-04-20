/* eslint-disable no-undef */
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    rules: {
        semi: ['error', 'always'],
        'no-console': 1,
        quotes: ['error', 'single'],
        curly: 0,
        indent: ['error', 4],
        '@typescript-eslint/no-unused-vars': 2,
    },
};
