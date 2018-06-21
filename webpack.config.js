/**
 *  Copyright (c) 2002-2018 T-Mobile USA, Inc. All rights reserved.
 *
 *  @file webpack.js
 *  @author Pat Herlihy <patrick.herlihy@t-mobile.com>
 *  @description The main configuration for webpack
 */

// Requires
const path = require('path');

// Plugins
const {
  DefinePlugin,
  ProvidePlugin,
  ContextReplacementPlugin,
} = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {
  TsConfigPathsPlugin,
  CheckerPlugin,
} = require('awesome-typescript-loader');

// Paths
const pathPackage = path.resolve(__dirname, './package.json');

/********************************************************************************
 *  Configuration Settings
 ********************************************************************************/

let settings = {};

// Application global definitions
settings.globalDefinitions = (env) => {
  return {
    BUILD_DATE: Date.now(),
    PRODUCTION: Boolean(env.production),
    THEME_KEY: env.theme || 'default',
    VERSION: JSON.stringify(require(pathPackage).version),
  };
};

// Application Title
settings.title = 'bug-karma-webpack-workers';

// Webpack resolver extensions
settings.extensions = ['.js', '.ts'];

// Application chunks
/*settings.chunks = {
  app: ['aurelia-bootstrapper'],
  polyfills: [
    'babel-polyfill', // Babel ES
    'js-polyfills/web', // HTML5
    'blob-util', // Blob support
    'intl', // Internationalization API
  ],
  vendor: [
    'axios', // HTTP Requests
    'base64-js', // Base64 utils
    'bodymovin', // Animations
    'date-fns', // Date functions
    'jsondiffpatch', // JSON Diff
    'jsonwebtoken', // JSON Web Tokens
    'lodash', // Utility Functions
    'lz-string', // String compression
    'sqlstring', // SQL Escaping
    'uuid', // UUIDs
    'interactjs', // Gesture/Touch Support
  ],
};

// Chunk load order
settings.chunkOrder = [
  'manifest',
  'common',
  'polyfills',
  'vendor',
  'aurelia-framework',
  'app',
];*/

// Common Chunks
const isVendor = ({ resource }) => /node_modules/.test(resource);
const isAurelia = ({ resource }) => /node_modules\/aurelia-/.test(resource);
settings.commonChunks = [
  {
    name: 'common',
    minChunks: (module, count) => (count >= 2 && isVendor(module) && !isAurelia(module)),
  },
  {
    name: 'aurelia-framework',
    chunks: ['app'],
    minChunks: isAurelia,
  },
  {
    name: 'vendor',
    chunks: ['app'],
    minChunks: (module) => (isVendor(module) && !isAurelia(module)),
  },
  {
    name: 'manifest',
    minChunks: Infinity,
  },
];

// Aurelia settings
settings.aurelia = {
  entry: 'entry',
  config: [],
};

// Paths
settings.paths = {
  base: (process.env.CDN_URL) ? process.env.CDN_URL : '/',
  outputDirectory: path.resolve(__dirname, './dist'),
  inputDirectories: [path.resolve(__dirname, './src')],
  excludeDirectories: [path.resolve(__dirname, './node_modules')],
};

// TS Loader Config
settings.tsloader = {
  configFileName: path.join(__dirname, './tsconfig.json'),
  compiler: 'typescript',
};

/********************************************************************************
 *  Configuration Function
 ********************************************************************************/

/**
 *  The webpack configuration function
 *
 *  @param  {Object} [webpackEnvironment] The environment variables set
 *
 *  @return {Object} The webpack configuration object
 */
function configure(webpackEnvironment = {}) {
  /********************************************************************************
   *  Webpack Configuration
   ********************************************************************************/

  let webpackConfiguration = {};

  /**
   *  Application entry
   ********************************************************************************/

  webpackConfiguration.entry = settings.chunks;

  /**
   *  Webpack Output
   ********************************************************************************/

  const outputName = (webpackEnvironment.production) ? '[name].[chunkhash]' : '[name].[hash]';
  webpackConfiguration.output = {
    path: settings.paths.outputDirectory,
    publicPath: settings.paths.base,
    filename: `${outputName}.bundle.js`,
    sourceMapFilename: `${outputName}.bundle.map`,
    chunkFilename: `${outputName}.chunk.js`,
    crossOriginLoading: 'anonymous',
  };

  /**
   *  Webpack Resolver
   ********************************************************************************/

  webpackConfiguration.resolve = {
    extensions: settings.extensions,
    modules: ['node_modules', ...settings.paths.inputDirectories],
    alias: settings.paths.aliases,
  };

  /**
   *  Development?
   ********************************************************************************/

  webpackConfiguration.devtool = (webpackEnvironment.production) ? 'source-map' : 'cheap-module-eval-source-map';
  webpackConfiguration.devServer = {
    contentBase: settings.paths.outputDirectory,
    historyApiFallback: true,
  };

  /********************************************************************************
   *  Module Rules
   ********************************************************************************/

  let rules = [];

  /**
   *  Javascript/Typescript
   ********************************************************************************/

  rules.push({
    test: /\.(js|ts)$/i,
    loader: 'awesome-typescript-loader',
    exclude: settings.paths.excludeDirectories,
    options: settings.tsloader,
  });

  /**
   *  Exposed Modules
   ********************************************************************************/

  // Bluebird -> Promise
  rules.push({
    test: /[/\\]node_modules[/\\]bluebird[/\\].+\.js$/,
    loader: 'expose-loader?Promise',
  });

  /**
   *  Images/Files
   ********************************************************************************/

  // Size limits
  const urlSizeLimit = 8192; // 8mb

  // Embed small data as data urls and larger ones as files
  rules.push({
    test: /\.(png|gif|jpg|cur)$/i,
    loader: 'url-loader',
    options: { limit: urlSizeLimit },
  });
  rules.push({
    test: /\.woff2(\?v=\d\.\d\.\d)?$/i,
    loader: 'url-loader',
    options: {
      limit: urlSizeLimit,
      mimetype: 'application/font-woff2',
    },
  });
  rules.push({
    test: /\.woff(\?v=\d\.\d\.\d)?$/i,
    loader: 'url-loader',
    options: {
      limit: urlSizeLimit,
      mimetype: 'application/font-woff',
    },
  });

  // Load fonts normally
  rules.push({
    test: /\.(ttf|eot|svg|otf)(\?v=\d\.\d\.\d)?$/i,
    loader: 'file-loader',
  });

  /**
   *  Preprocess conditionals
   ********************************************************************************/

  rules.push({
    test: /\.(\w+)$/i,
    loader: 'preprocess-loader',
    include: settings.paths.inputDirectories,
    enforce: 'pre',
    options: settings.globalDefinitions(webpackEnvironment),
  });

  // Add rules
  webpackConfiguration.module = { rules };

  /********************************************************************************
   *  Plugins
   ********************************************************************************/

  let plugins = [];

  /**
   *  Global Definitions
   ********************************************************************************/

  plugins.push(new DefinePlugin(settings.globalDefinitions(webpackEnvironment)));

  /**
   *  Typescript loader plugins
   ********************************************************************************/

  plugins.push(new TsConfigPathsPlugin(settings.tsloader));
  plugins.push(new CheckerPlugin());

  /**
   *  Build our index.html automatically
   ********************************************************************************/

  let HtmlWebpackPluginOptions = {
    template: 'index.template',
    chunks: settings.chunkOrder,
    chunksSortMode: 'manual',
    metadata: {
      title: settings.title,
      base: settings.paths.base,
    },
  };

  // Add plugins
  webpackConfiguration.plugins = plugins;

  // Return our configuration
  return webpackConfiguration;
}

// Export our configuration function
module.exports = configure;
