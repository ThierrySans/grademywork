The key part of bundling standalone modules with Browserify is the --s option. It exposes whatever you export from your module using node's module.exports as a global variable. The file can then be included in a <script> tag.

browserify index.js --s module > dist/module.js