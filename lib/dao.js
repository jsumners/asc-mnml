'use strict'

const ty = require('then-yield')
const ioc = require('laic').laic.asc
const log = ioc.get('logger').child({component: 'dao'})
const moment = require('moment')
const mongoose = ioc.get('mongoose')

let MinimalMonday
let Entry

function getMondayQuery (date) {
  return {
    date: {
      $gte: moment(date).utc().startOf('day').toDate(),
      $lt: moment(date).utc().add(1, 'days').startOf('day').toDate()
    }
  }
}

function DAO () {}

DAO.prototype.getEntries = function getEntries (date) {
  log.debug('retrieving entries for: %s', date)
  return MinimalMonday.model
    .findOne(getMondayQuery(date))
    .populate({path: 'entries'})
    .then((day) => {
      if (!day) {
        log.trace('no data found for date: %s', date)
        return null
      }
      log.trace('got day: %s', day.date.toISOString())
      return Promise.resolve(day.entries)
    })
    .catch((err) => {
      log.error('failed to get entries: %s', err.message)
      log.debug(err.stack)
      return Promise.reject(err)
    })
}

DAO.prototype.addEntry = function addEntry (date, entry) {
  function * generator () {
    try {
      log.trace('adding entry: (%s, %j)', date.toISOString(), entry)
      const _entry = yield Entry.model.create(entry)
      let monday = yield MinimalMonday.model
        .findOne(getMondayQuery(date)).populate({path: 'entries'})
      if (!monday) {
        log.trace('did not find a minimal monday')
        monday = new MinimalMonday.model // eslint-disable-line
      }
      monday.entries.push(_entry)
      monday.markModified()
      yield monday.save()
      return _entry
    } catch (e) {
      log.error('dao error: %s', e.message)
      log.debug(e.stack)
      throw e
    }
  }

  return ty.spawn(generator)
}

DAO.prototype.getPreviousDay = function previousDay (date) {
  return MinimalMonday.model
    .find({
      date: { $lt: moment(date).utc().startOf('day').toDate() }
    })
    .sort({ date: 'desc' })
    .limit(1)
    .then((days) => (days.length > 0) ? days[0] : null)
}

DAO.prototype.getNextDay = function nextDay (date) {
  return MinimalMonday.model
    .find({
      date: { $gt: moment(date).utc().endOf('day').toDate() }
    })
    .sort({ date: 'asc' })
    .limit(1)
    .then((days) => (days.length > 0) ? days[0] : null)
}

let dao
module.exports = function getDao () {
  if (dao) {
    return dao
  }

  MinimalMonday = require('./MinimalMonday')(mongoose)
  Entry = require('./Entry')(mongoose)
  dao = new DAO()
  return dao
}
