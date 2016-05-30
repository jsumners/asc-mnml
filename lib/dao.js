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

/**
 * An interface for getting and setting data in the database.
 *
 * @constructor
 */
function DAO () {}

/**
 * Takes a given date, that must be Monday, and returns
 * the list of entries for that day.
 *
 * @param {Date} date The Monday to query.
 * @returns {Promise.<Array>} List of entries.
 */
DAO.prototype.getEntries = function getEntries (date) {
  log.debug('retrieving entries for: %s', date)
  if (moment(date).day() !== 1) {
    const error = new Error('date must be a Monday')
    error.isMonday = false
    return Promise.reject(error)
  }
  return MinimalMonday.model
    .findOne(getMondayQuery(date))
    .populate({path: 'entries'})
    .then((day) => {
      if (!day) {
        log.trace('no data found for date: %s', date)
        return Promise.resolve([])
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

/**
 * Adds a Minimal Monday entry for a given date, must be a Monday,
 * and entry object.
 *
 * @param {Date} date Must be a Monday.
 * @param {object} entry The entry details
 * @returns {*}
 */
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

/**
 * Given a date, get the previous Minimal Monday. If the day
 * is a Tuesday, then it will return the current week's
 * Minimal Monday. If the day is a Monday, then it will
 * return the previous Minimal Monday.
 *
 * @param {Date} date The day to initiate the query from.
 * @returns {*}
 */
DAO.prototype.getPreviousDay = function previousDay (date) {
  return MinimalMonday.model
    .find({
      date: { $lt: moment(date).utc().startOf('day').toDate() }
    })
    .sort({ date: 'desc' })
    .limit(1)
    .then((days) => (days.length > 0) ? days[0] : null)
}

/**
 * Retrieves the upcoming Minimal Monday if present in the
 * database.
 *
 * @param {Date} date The date from which to calculate the
 * upcoming Monday.
 * @returns {*}
 */
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

module.exports.internals = {getMondayQuery}
