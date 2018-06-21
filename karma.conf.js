/**
 *  Copyright (c) 2017 Layer3 TV. All rights reserved.
 *
 *  @file karma.conf.js
 *  @author Pat Herlihy <pherlihy@layer3tv.com>
 *  @description The Karma configuration
 *
 *  https://karma-runner.github.io/1.0/config/configuration-file.html
 */

// Requires
const path = require('path');

// Set our ts-node options
require('ts-node').register({
  compilerOptions: { module: 'commonjs' },
  disableWarnings: true,
  fast: true,
});

// Chrome path
process.env.CHROME_BIN = require('puppeteer').executablePath();

/**
 *  The callback to configure Karma
 *
 *  @param   {Object} config The configuration
 *
 *  @return {undefined}
 */
function configureKarma(config) {
  // Build our configuration
  let karmaConfig = {};

  // Dont watch for changes
  karmaConfig.autoWatch = false;

  // The base path that all urls resolve to
  karmaConfig.basePath = path.resolve(__dirname);

  // Allow retries
  karmaConfig.browserDisconnectTolerance = 3;
  karmaConfig.browserNoActivityTimeout = 60 * 1000;

  // The browsers to launch tests with
  // https://npmjs.org/browse/keyword/karma-launcher
  karmaConfig.browsers = ['Chrome'];

  // Enable colors
  karmaConfig.colors = true;

  // Load our setup file before running tests
  karmaConfig.files = [
    {
      pattern: './karma.setup.js',
      watched: false,
    },
  ];

  // The test frameworks to use
  // https://npmjs.org/browse/keyword/karma-adapter
  karmaConfig.frameworks = ['jasmine'];

  // Set our log level
  karmaConfig.logLevel = config.LOG_ERROR;

  // The port to run our server on
  const serverPort = 11337;
  karmaConfig.port = serverPort;

  // Setup webpack as our preprocessor
  // https://npmjs.org/browse/keyword/karma-preprocessor
  karmaConfig.preprocessors = { './karma.setup.js': ['webpack', 'sourcemap'] };

  // Configure webpack
  karmaConfig.webpack = require('./webpack.config.js')({ coverage: true });
  karmaConfig.webpackServer = { noInfo: true };

  // Set our reporters
  // https://npmjs.org/browse/keyword/karma-reporter
  karmaConfig.reporters = [
    'verbose',
    'progress',
    'junit',
  ];

  // Exit out if tests fail
  karmaConfig.singleRun = true;

  // Set our config
  return config.set(karmaConfig);
}

// Exports
module.exports = configureKarma;
