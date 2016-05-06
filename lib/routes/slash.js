'use strict';

const moment = require('moment');
const ioc = require('laic').laic.asc;
const log = ioc.get('logger').child({route: 'slash'});
const introduce = require('introduce')(__dirname);
const views = introduce('../views');
const dao = introduce('../dao')();

const format = 'dddd, D MMMM YYYY';

const slashGet = {
  path: '/{date?}',
  method: 'GET',
  handler(req, reply) {
    log.debug('got slash request');
    let date = moment().day(1);
    if (req.params.date) {
      date = moment(req.params.date, 'YYYY-MM-DD');
    }

    if (date.isSame(moment().day(8), 'day') || date.isAfter(moment().day(8), 'day')) {
      return reply(views.slash({
        date: date.format(format),
        error: `Sorry, you're too early. Come back on ${date.format(format)}.`
      }));
    }

    dao
      .getEntries(date.toDate())
      .then((entries) => {
        log.debug('rendering slash');
        reply(views.slash({
          date: date.format(format),
          entries: entries
        }));
      })
      .catch((err) => {
        log.error('could not render slash: %s', err.message);
        log.debug(err.stack);
        reply(err);
      });
  }
};

module.exports = [slashGet];
