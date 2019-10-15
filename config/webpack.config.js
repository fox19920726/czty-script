const path = require('path');
const webpack = require('webpack');
const paths = require('./paths');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // css 代码打包成文件注入html
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin; // 打包体积
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin'); // css 代码压缩
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const {
  WARN_AFTER_BUNDLE_GZIP_SIZE,
  WARN_AFTER_CHUNK_GZIP_SIZE,
} = require('./limit');

const { isSameObject } = require('./utils');

function resolve(dir) {
  return path.join(__dirname, '../../../', dir)
}

function getSplitChunkConfig(useAntd) {
  return useAntd
    ? {
        antd: {
          test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
          name: 'antd',
          minChunks: 1,
          chunks: 'all',
          priority: -10,
        },
        vendors: {
          //cacheGroups重写继承配置，设为false不继承
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          minChunks: 1,
          priority: -20,
        },
        index: {
          minChunks: 1,
          priority: -30,
          name: 'index',
          reuseExistingChunk: true,
        },
        default: false,
      }
    : {
        vendors: {
          //cacheGroups重写继承配置，设为false不继承
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          minChunks: 1,
          priority: -20,
        },
      };
}

function build(webpackEnv = 'development', extConfig) {
  const NODE_ENV = process.env.NODE_ENV;
  const isServer = NODE_ENV === 'local';
  const isProduction = webpackEnv === 'production';
  const openAnalyse = extConfig.useAnalyse || false;
  const serverPath = extConfig.publicPath || './';
  const useEslint = extConfig.useEslint || false;
  const title = extConfig.title;

  const config = {
    entry: './src/index.js',
    devtool: isProduction ? false : 'cheap-source-map',
    mode: isProduction ? 'production' : 'development',
    output: {
      filename: path.posix.join(isServer ? 'js/bundle.js' : 'js/bundle.[contenthash:8].js'),
      chunkFilename: path.posix.join(isServer? 'js/[name].bundle.js':'js/[name].bundle.[contenthash:8].js'),
      // eslint-disable-next-line no-undef
      path: path.resolve(__dirname, paths.output),
      publicPath: isProduction ? serverPath : './',
    },
    resolve: {
      extensions: ['.js', '.vue', '.json'],
      alias: {
        '@': resolve('src')
      }
    },
    module: {
      rules: [
        {
          test: /\.(vue|js)?$/,
          loader: 'eslint-loader',
          enforce: 'pre',
          include: paths.appSrc,
          options: {
            formatter: require('eslint-friendly-formatter'), // 指定错误报告的格式规范
            quiet: true, // 只上报error，不上报warning
          },
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude:/node_modules/
        },
        {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
          loader: 'url-loader',
          options: {
            limit: 30000,
            name: path.posix.join('font/[name].[hash:7].[ext]')
          }
        },
        {
          test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
          loader: 'url-loader',
          options: {
            limit: 10000, // 配置了10以下上限，那么当超过这个上线时，loader实际上时使用的file-loader；
            name: path.posix.join('images/[name].[hash:7].[ext]')
          },
        },
        {
          // 对于纯css文件，由于面向的是第三方库，无需开启module
          test: /\.(css|scss)$/,
          use: [
            {
              loader:MiniCssExtractPlugin.loader
            },
            'css-loader',
            'sass-loader',
            'postcss-loader'
          ],
        }
      ],
    },
    // 公共js单独打包
    optimization: {
      splitChunks: {
        minSize: 30000,
        chunks: 'all', // all, async, and initial, all means include all types of chunks
        name: false,
        cacheGroups: getSplitChunkConfig(!isServer && extConfig.useAntd),
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'index.html',
        favicon: resolve('favicon.ico'),
        inject: true
      }),
      new webpack.DefinePlugin({
        'process.env': { NODE_ENV: "'" + NODE_ENV + "'" },
      }),
      new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash:8].css',
        chunkFilename: 'css/[id].[contenthash:8].css',
        ignoreOrder: false
      }),
      new OptimizeCSSAssetsPlugin(),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // I just leave zh-ch to my package
      // You can remove this if you don't use Moment.js:
      new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh-cn/),
      new VueLoaderPlugin(),
    ],
  };
  if (isServer) {
    // 当开启了hot：true，会自动添加hotReplaceModule
    config.plugins.push(new webpack.NamedModulesPlugin());
  } else {
    config.plugins.push(new UglifyJsPlugin({
      uglifyOptions: {
        warnings: false,
        mangle: true,
        toplevel: false,
        ie8: false,
        keep_fnames: false,
        compress: {
          drop_debugger: true,
          drop_console: true
        }
      }
    }));
    openAnalyse && config.plugins.push(new BundleAnalyzerPlugin());
  }
  if (isProduction) {
    config.performance = {
      maxAssetSize: WARN_AFTER_CHUNK_GZIP_SIZE,
      maxEntrypointSize: WARN_AFTER_BUNDLE_GZIP_SIZE,
    };
  }
  return config;
}

const initConfig = {
  useAnalyse: false, // 是否开启打包体积分析
  useAntd: false, // 是否开启antd打包优化
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
