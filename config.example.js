'use strict'

module.exports = {
  logger: {
    name: 'ascmnml',
    level: 'info'
  },

  mongoose: {
    uri: 'mongodb://localhost/asc',
    options: {}
  },

  server: {
    connection: {
      address: '127.0.0.1',
      port: '9000'
    }
  },

  soundcloud: {
    clientId: 'not used right now'
  }
}
