/* eslint-disable no-undef */
module.exports = {
    mount: {
        public: '/',
        src: '/dist',
    },
    devOptions: {},
    buildOptions: {
        out: '_build',
    },
    optimize: {
        bundle: true,
        minify: true,
        sourcemap: false,
    },
};
