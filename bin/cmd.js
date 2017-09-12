#!/usr/bin/env node

var program = require('commander'),
  packageInfo = require('../package.json');

program
  .version(packageInfo.version)
  .option('-p, --port <port>', 'server port. Defaults to 25.')
  .option('-c, --config <path>', 'set config path. Defaults to ./ses-credentials.json')
  .parse(process.argv);

var server = require('../index.js');
var options = {
  port: program.port,
  config: program.config,
  proxy: program.proxy
};

server(options);