'use strict';

const introduce = require('introduce')(__dirname);
const pino = require('pino');
let log = pino({ level: 'info' });

const fs = require('fs');
let config;
try {
  config = require('./config.js');
} catch (e) {
  log.error('could not load config: %s', e.message);
  process.exit(1);
}

const ioc = require('laic').laic.addNamespace('asc');
log = pino(config.logger);
ioc.register('logger', log, false);
ioc.register('config', config, false);

const mongoose = require('mongoose').connect(
  config.mongoose.uri,
  config.mongoose.options
);
ioc.register('mongoose', mongoose, false);

const hapi = require('hapi');
const server = new hapi.Server();
ioc.register('server', server, false);

server.register(
  require('inert'),
  (err) => {
    if (err) {
      log.error('could not load inert: %s', err.message);
      log.debug(err.stack);
      return;
    }
  }
);

server.connection(config.server.connection);
server.route(introduce('lib/routes'));
server.start((err) => {
  if (err) {
    log.error('server failed to start: %s', err.message);
    log.debug(err.stack);
    mongoose.disconnect();
    process.exit(1);
  }
  log.info('server started: %s', server.info.uri);
  introduce('lib/processManagement');
});
