'use strict'

const ioc = require('laic').laic.asc
const log = ioc.get('logger').child({component: 'processManagement'})

function stopMongoose () {
  const mongoose = ioc.get('mongoose')
  if (!mongoose) {
    return Promise.resolve()
  }
  log.info('stopping mongoose')
  return mongoose.disconnect()
}

function stopDataSources () {
  return stopMongoose()
    .catch((err) => {
      log.error('error stopping mongoose: %s', err.message)
      log.debug(err.stack)
    })
    .then(() => log.info('mongoose stopped'))
    // .then(stopNextSource)....
}

function shutdown () {
  stopDataSources()
    .then(() => log.info('stopping web server'))
    .then(() => {
      const server = ioc.get('server')
      if (server) {
        server.stop(() => log.info('web server stopped'))
      }
    })
    .catch((err) => {
      log.error('shutdown failed: %j', err)
      log.error('terminating ungracefully')
      process.exit(1)
    })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
