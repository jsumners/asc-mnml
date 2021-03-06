'use strict'

const ty = require('then-yield')
const moment = require('moment')
const introduce = require('introduce')(__dirname)
const views = introduce('../views')
const dao = introduce('../dao')()

const format = 'dddd, D MMMM YYYY'

const slashGet = {
  path: '/{date?}',
  method: 'GET',
  handler (req, reply) {
    req.log(['slash', 'trace'], 'got slash GET request')
    let date = moment().day(1)
    if (req.params.date) {
      date = moment(req.params.date, 'YYYY-MM-DD')
    }

    if (date.isSame(moment().day(8), 'day') || date.isAfter(moment().day(8), 'day')) {
      return reply(views.slash({
        date: date.format(format),
        error: `Sorry, you're too early. Come back on ${date.format(format)}.`
      }))
    }

    function * generator () {
      try {
        const d = date.toDate()
        const entries = yield dao.getEntries(d)
        const previousDay = yield dao.getPreviousDay(d)
        const nextDay = yield dao.getNextDay(d)
        req.log(['slash', 'trace'], 'rendering entries list')
        return reply(views.slash({
          date: date.format(format),
          entries: entries,
          previousDay: previousDay,
          nextDay: nextDay
        })).type('text/html')
      } catch (e) {
        req.log(['slash', 'error'], 'could not render entries list: %s', date.format(format))
        req.log(['slash', 'error'], 'error: %s', e.message)
        req.log(['slash', 'debug'], e.stack)
        return reply(e)
      }
    }

    return ty.spawn(generator)
  }
}

module.exports = [slashGet]
