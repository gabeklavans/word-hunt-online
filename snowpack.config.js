/* eslint-disable no-undef */
module.exports = {
    mount: {
        public: '/',
        src: '/dist',
    },
    devOptions: {
        port: 8081,
        open: 'none',
    },
    buildOptions: {
        out: '_build',
    },
    optimize: {
        bundle: true,
        minify: true,
        sourcemap: false,
    },
};
