'use strict'

module.exports = {
  logger: {
    name: 'ascmnml',
    level: 'info',

    // Enable pretty printing of logs. Should be false in production.
    pretty: false
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
