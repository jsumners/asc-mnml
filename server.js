'use strict'

const introduce = require('introduce')(__dirname)
const pino = require('pino')
let log = pino({ level: 'info' })

let config
try {
  config = require('./config.js')
} catch (e) {
  log.error('could not load config: %s', e.message)
  log.debug(e.stack)
  process.exit(1)
}

const ioc = require('laic').laic.addNamespace('asc')

let pretty
if (config.logger.pretty) {
  pretty = pino.pretty()
  pretty.pipe(process.stdout)
}
log = pino(config.logger, pretty)
ioc.register('logger', log, false)
ioc.register('config', config, false)

const mongoose = require('mongoose').connect(
  config.mongoose.uri,
  config.mongoose.options
)
ioc.register('mongoose', mongoose, false)

const hapi = require('hapi')
const server = new hapi.Server()
ioc.register('server', server, false)

server.connection(config.server.connection)
server.register(
  [
    {
      register: require('hapi-pino'),
      options: {
        instance: log
      }
    },
    require('inert')
  ],
  (err) => {
    if (err) {
      server.log(['error'], `could not register hapi plugins: ${err.message}`)
      server.log(['debug'], err.stack)
    }
  }
)

server.route(introduce('lib/routes'))
server.start((err) => {
  if (err) {
    server.log(['error'], `server failed to start: ${err.message}`)
    server.log(['debug'], err.stack)
    mongoose.disconnect()
    process.exit(1)
  }
  introduce('lib/processManagement')
})
