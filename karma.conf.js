// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

process.env.CHROME_BIN = process.env.CHROME_BIN || '/opt/homebrew/bin/chromium';

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    files: [
      { pattern: './node_modules/@swisseph/browser/dist/swisseph.wasm', included: false, watched: false, served: true }
    ],
    proxies: {
      '/_karma_webpack_/swisseph.wasm': '/base/node_modules/@swisseph/browser/dist/swisseph.wasm',
      '/_karma_webpack_/dist/swisseph.wasm': '/base/node_modules/@swisseph/browser/dist/swisseph.wasm',
      '/swisseph.wasm': '/base/node_modules/@swisseph/browser/dist/swisseph.wasm',
      '/dist/swisseph.wasm': '/base/node_modules/@swisseph/browser/dist/swisseph.wasm'
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/stary'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    restartOnFileChange: true
  });
};
