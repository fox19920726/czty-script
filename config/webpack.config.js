const path = require('path');
const webpack = require('webpack');
const paths = require('./paths');
const sassGlobal = require(paths.appSrc+'/webpack.out.config').sassGlobal
const externals = require(paths.appSrc+'/webpack.out.config').externals || {}
const shouldCopyFile = require(paths.appSrc+'/webpack.out.config').shouldCopyFile || []
const type = require(paths.appSrc+'/webpack.out.config').type || 'Vue'

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // css 代码打包成文件注入html
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin; // 打包体积
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin'); // css 代码压缩
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const TerserPlugin = require('terser-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const eslintFormatter = require('react-dev-utils/eslintFormatter');
const ESLintPlugin = require('eslint-webpack-plugin');

const {
  WARN_AFTER_BUNDLE_GZIP_SIZE,
  WARN_AFTER_CHUNK_GZIP_SIZE,
} = require('./limit');

const { isSameObject } = require('./utils');

function resolve(dir) {
  return path.join(__dirname, '../../../', dir)
}
const sassGlobalSrc = sassGlobal.map((currentValue) => {
  return resolve('src/styles/' + currentValue)
})

function getSplitChunkConfig() {
  return {
    vendors: {
      test: /[\\/]node_modules[\\/]/,
      name: 'vendors',
      minChunks: 1,
      priority: -20,
    }
  }
}

function generateCopyFile() {
  const fileArr = []
  shouldCopyFile.map((item) => {
    fileArr.push({
      from: resolve(item),
      to: './'
    })
  })
  return fileArr
}

function build(webpackEnv = 'development', extConfig) {
  const NODE_ENV = process.env.NODE_ENV;
  const isServer = NODE_ENV === 'local';
  const isProduction = webpackEnv === 'production';
  const openAnalyse = extConfig.useAnalyse || false;
  const serverPath = extConfig.publicPath || './';
  const useEslint = extConfig.useEslint || false;
  const title = extConfig.title;
  const rules = [{
    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 30000,
        name: path.posix.join(isServer ? 'font/[name].[ext]' :'font/[name].[hash:7].[ext]')
      }
    }, {
      test: /\.(png|jpe?g|gif|svg|mp4|pdf)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000, // 配置了10以下上限，那么当超过这个上线时，loader实际上时使用的file-loader；
        name: path.posix.join(isServer ? 'images/[name].[ext]' : 'images/[name].[hash:7].[ext]')
      },
    }
  ]
  const plugins = [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      favicon: resolve('favicon.ico'),
      inject: true,
      chunks:['index']
    }),
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: "'" + NODE_ENV + "'" },
    }),
    new OptimizeCSSAssetsPlugin(),
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh-cn/),
    new CopyWebpackPlugin(generateCopyFile()),
    new ESLintPlugin({
      extensions: ['ts', 'tsx', 'js', 'jsx'],
      emitError: true,
      emitWarning: true
    })
  ]

  if (type === 'Vue') {
    rules.push({
      test: /\.vue$/,
      loader: 'vue-loader',
    },
    {
      test: /\.js$/,
      loader: 'babel-loader',
      exclude:/node_modules/
    })
    plugins.push(new VueLoaderPlugin())
  }

  if (type === 'React') {
    rules.push({
      test: /\.(js|jsx|tsx|ts)?$/,
      include: paths.appSrc,
      loader: 'babel-loader'
    })
  }

  const config = {
    entry: {
      index:'./src/index.tsx'
    },
    externals: externals,
    devtool: isProduction ? false : 'cheap-source-map',
    mode: isProduction ? 'production' : 'development',
    output: {
      filename: path.posix.join(isServer ? 'js/bundle.js' : 'js/bundle.[contenthash:8].js'),
      chunkFilename: path.posix.join(isServer? 'js/[name].bundle.js':'js/[name].bundle.[contenthash:8].js'),
      // eslint-disable-next-line no-undef
      path: path.resolve(__dirname, paths.output),
      publicPath: isProduction ? serverPath : './'
    },
    resolve: {
      extensions: ['.js', '.vue', '.json', '.jsx', '.ts', '.tsx'],
      alias: {
        '@': resolve('src')
      }
    },
    module: {
      rules: rules
    },
    // 公共js单独打包
    optimization: {
      splitChunks: {
        minSize: 30000,
        chunks: 'async', // all, async, and initial, all means include all types of chunks
        name: false,
        cacheGroups: getSplitChunkConfig(),
      }
    },
    plugins: plugins,
  };
  if (isServer) {
    config.module.rules.push(
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[local]',
            },
          },
          'sass-loader',
          'postcss-loader',
          {
            loader: 'sass-resources-loader',
            options: {
              resources: sassGlobalSrc
            },
          },
        ],
      }
    )
    // 当开启了hot：true，会自动添加hotReplaceModule
    config.plugins.push(new webpack.NamedModulesPlugin());
  } else {
    config.module.rules.push(
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader:MiniCssExtractPlugin.loader,
            options:{
              publicPath:'../'
            }
          },
          'css-loader',
          'sass-loader',
          'postcss-loader',
          {
            loader: 'sass-resources-loader',
            options: {
              resources: sassGlobalSrc
            },
          },
        ],
      }
    )
    config.plugins.push(
      new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash:8].css',
        chunkFilename: 'css/[id].[contenthash:8].css',
        ignoreOrder: false
      })
    )
    openAnalyse && config.plugins.push(new BundleAnalyzerPlugin());
    config.optimization = { ...config.optimization, ...{
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: undefined,
            warnings: false,
            parse: {},
            compress: {},
            mangle: true, // Note `mangle.properties` is `false` by default.
            module: false,
            output: null,
            toplevel: false,
            nameCache: null,
            ie8: true,
            keep_classnames: undefined,
            keep_fnames: false,
            safari10: true,
          }
        })
      ],
    }}
  }
  if (isProduction) {
    config.performance = {
      maxAssetSize: WARN_AFTER_CHUNK_GZIP_SIZE,
      maxEntrypointSize: WARN_AFTER_BUNDLE_GZIP_SIZE,
    }
  }
  return config
}

const initConfig = {
  useAnalyse: false, // 是否开启打包体积分析
  useEslint: true, // 编译前检查代码格式
  publicPath: './',
};

const cache = {};

module.exports = function createWithCache(
  webpackEnv = 'development',
  extConfig = initConfig
) {
  const NODE_ENV = process.env.NODE_ENV;
  if (cache[NODE_ENV] && isSameObject(cache[NODE_ENV].last, extConfig)) {
    return cache[NODE_ENV].config;
  }
  cache[NODE_ENV] = {};
  cache[NODE_ENV].last = extConfig;
  cache[NODE_ENV].config = build(webpackEnv, extConfig);
  return cache[NODE_ENV].config;
};
