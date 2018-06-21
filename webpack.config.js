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
  optimize: {
    CommonsChunkPlugin,
    UglifyJsPlugin,
  },
  ProvidePlugin,
  ContextReplacementPlugin,
} = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { AureliaPlugin } = require('aurelia-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackMonitor = require('webpack-monitor');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const {
  TsConfigPathsPlugin,
  CheckerPlugin,
} = require('awesome-typescript-loader');
const WebpackShellPlugin = require('webpack-shell-plugin');
const ResourceHintWebpackPlugin = require('resource-hints-webpack-plugin');
const SRIPlugin = require('webpack-subresource-integrity');

// Paths
const pathPackage = path.resolve(__dirname, '../package.json');
const pathMonitor = path.resolve(__dirname, '../stats/monitor.json');
const pathAnalyzer = path.resolve(__dirname, '../stats/analyzer.json');

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
settings.title = 'T-Mobile | Alloy';

// Webpack resolver extensions
settings.extensions = ['.js', '.ts'];

// Application chunks
settings.chunks = {
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
];

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
  outputDirectory: path.resolve(__dirname, '../dist'),
  inputDirectories: [path.resolve(__dirname, '../src')],
  excludeDirectories: [path.resolve(__dirname, '../node_modules')],
  aliases: {
    alloy: path.resolve(__dirname, '../src'),
    'styles': path.resolve(__dirname, '../src/global/styles'),
    'styles-shared': path.resolve(__dirname, '../src/global/styles/shared'),
    'styles-default': path.resolve(__dirname, '../src/global/styles/default'),
    'styles-phone': path.resolve(__dirname, '../src/extensions/phone/styles'),
  },
};

// Style Loaders
settings.styles = () => [
  {
    loader: 'css-loader',
    options: {
      url: false,
      camelCase: true,
      alias: settings.paths.aliases,
      importLoaders: 1,
    },
  },
  {
    loader: 'postcss-loader',
    options: {
      ident: 'postcss',
      plugins: (loader) => [
        require('postcss-import')({
          addDependencyTo: loader,
          root: settings.paths.aliases.alloy,
        }),
        require('postcss-cssnext')({ browsers: ['last 2 versions', '> 5%'] }),
      ],
      sourceMap: true,
    },
  },
];

// Get styles based on webpack settings
settings.getStyles = (production) => {
  const styles = settings.styles();

  // css-loader options
  const cssLoader = styles[0].options;

  // Minimize?
  cssLoader.minimize = Boolean(production);

  // Class name generation
  cssLoader.localIdentName = (production) ? '[local]--[hash:base64:12]' : '[path][name]__[local]--[hash:base64:4]';

  return styles;
};

// Files to copy
settings.copy = [
  {
    from: path.resolve(__dirname, '../static'),
    to: './static',
  },
];

// Scripts to run on build
settings.buildEvents = { onBuildExit: [`node ${path.resolve(__dirname, '../scripts/copy-locales.js')}`] };

// TS Loader Config
settings.tsloader = {
  configFileName: path.join(__dirname, '../tsconfig.json'),
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
   *  Imported Styles
   ********************************************************************************/

  let importedStyles = {
    test: /\.css$/i,
    issuer: [{ not: [{ test: /\.html$/i }] }],
  };

  // Should we inline the styles?
  if (webpackEnvironment.inline) {
    importedStyles.use = ['style-loader', ...settings.getStyles(webpackEnvironment.production)];
  } else {
    importedStyles.use = ExtractTextPlugin.extract({
      use: settings.getStyles(webpackEnvironment.production),
      fallback: 'style-loader',
    });
  }

  rules.push(importedStyles);

  /**
   *  Required Styles
   ********************************************************************************/

  rules.push({
    test: /\.css$/i,
    issuer: [{ test: /\.html$/i }],
    use: settings.getStyles(webpackEnvironment.production),
  });

  /**
   *  HTML
   ********************************************************************************/

  rules.push({
    test: /\.html$/i,
    loader: 'html-loader',
  });

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
   *  JSON Objects
   ********************************************************************************/

  rules.push({
    test: /\.json$/i,
    loader: 'json-loader',
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
   *  Coverage
   ********************************************************************************/

  if (webpackEnvironment.coverage) {
    rules.push({
      test: /\.(js|ts)$/i,
      loader: 'istanbul-instrumenter-loader',
      include: settings.paths.inputDirectories,
      exclude: [/test\/.+/i],
      enforce: 'post',
      options: { esModules: true },
    });

    webpackConfiguration.devtool = 'inline-source-map';
  }

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
   *  Aurelia
   ********************************************************************************/

  plugins.push(new AureliaPlugin({
    aureliaApp: settings.aurelia.entry,
    aureliaConfig: settings.aurelia.config,
  }));

  /**
   *  Automatically load modules globally
   ********************************************************************************/

  plugins.push(new ProvidePlugin({ 'Promise': 'bluebird' }));

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

  // Minify?
  if (webpackEnvironment.production) {
    HtmlWebpackPluginOptions.minify = {
      removeComments: true,
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      minifyCSS: true,
      minifyJS: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      ignoreCustomFragments: [/\${.*?}/g],
    };
  }

  plugins.push(new HtmlWebpackPlugin(HtmlWebpackPluginOptions));
  plugins.push(new ResourceHintWebpackPlugin());

  /**
   *  Subresource Integrity
   ********************************************************************************/

  plugins.push(new SRIPlugin({
    hashFuncNames: ['sha256', 'sha384'],
    enabled: webpackEnvironment.production,
  }));

  /**
   *  Copy files
   ********************************************************************************/

  if (settings.copy.length !== 0) {
    plugins.push(new CopyWebpackPlugin(settings.copy));
  }

  /**
   *  JSON Diff
   ********************************************************************************/

  plugins.push(new ContextReplacementPlugin(
    /jsondiffpatch\/.*/,
    path.resolve(__dirname, '../node_modules/jsondiffpatch'), {
      '../package.json': './package.json',
      './formatters': './src/formatters/index.js',
      './console': './src/formatters/console.js',
    }
  ));

  /**
   *  Webpack Monitor
   ********************************************************************************/

  if (webpackEnvironment.monitor) {
    plugins.push(new WebpackMonitor({
      capture: true,
      target: pathMonitor,
      launch: false,
      port: 8020,
    }));

    plugins.push(new BundleAnalyzerPlugin({
      generateStatsFile: true,
      statsFilename: pathAnalyzer,
      openAnalyzer: false,
      analyzerPort: 8030,
    }));
  }

  /**
   *  Should we extract styles to their own files?
   ********************************************************************************/

  if (!webpackEnvironment.inline) {
    plugins.push(new ExtractTextPlugin({
      filename: (webpackEnvironment.production) ? '[contenthash].css' : '[id].css',
      allChunks: true,
      ignoreOrder: true,
    }));
  }

  /**
   *  Should we extract common modules/chunks for better caching?
   ********************************************************************************/

  if (webpackEnvironment.production) {
    // Common chunks
    settings.commonChunks.forEach((chunk) => plugins.push(new CommonsChunkPlugin(chunk)));

    // Minify
    plugins.push(new UglifyJsPlugin({
      test: /\.(js|ts)$/i,
      include: settings.paths.inputDirectories,
      sourceMap: true,
      uglifyOptions: { ecma: 5 },
    }));
  }

  /**
   *  Build events
   ********************************************************************************/

  plugins.push(new WebpackShellPlugin(settings.buildEvents));

  // Add plugins
  webpackConfiguration.plugins = plugins;

  // Return our configuration
  return webpackConfiguration;
}

// Export our configuration function
module.exports = configure;
