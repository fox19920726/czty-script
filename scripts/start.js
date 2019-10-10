'use strict';

const paths = require('../config/paths');
const webpackOutConfig = require(paths.appSrc+'/webpack.out.config')

process.env.NODE_ENV = 'local';
process.env.BASE_URL = webpackOutConfig.url.start.baseUrl
process.on('unhandledRejection', err => {
  throw err;
});

const chalk = require('chalk');
const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('../config/clearConsole');
const configFactory = require('../config/webpack.config');
const { createCompiler } = require('./base');
const ArgStart = 2;
const isInteractive = process.stdout.isTTY;

const title = require(paths.appPackageJson).title || 'czty site';
const config = configFactory('development', { title });

const serverConfig = Object.assign(
  {
    host: 'localhost',
    port: '3000',
    hot: true,
    inline: true,
    open: true,
    quiet: true,
    overlay: true,
    stats: {
      colors: true,
    },
    contentBase: [paths.output],
    watchContentBase: true
  },
  webpackOutConfig.dev
);

const HOST = serverConfig.host;
const port = parseInt(serverConfig.port, 10);

WebpackDevServer.addDevServerEntrypoints(config, serverConfig);
const compiler = createCompiler(config, serverConfig);

const devServer = new WebpackDevServer(compiler, serverConfig);

devServer.listen(port, HOST, err => {
  if (err) {
    return console.log(err);
  }
  if (isInteractive) {
    // console.log('clear...');
    // clearConsole();
  }
  console.log(chalk.cyan('Starting the development server...\n'));
  // openBrowser(urls.localUrlForBrowser);
});

['SIGINT', 'SIGTERM'].forEach(function(sig) {
  process.on(sig, function() {
    devServer.close();
    process.exit();
  });
});
