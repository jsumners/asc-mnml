'use strict';

const ty = require('then-yield');
const ioc = require('laic').laic.asc;
const log = ioc.get('logger').child({component: 'dao'});
const moment = require('moment');
const mongoose = ioc.get('mongoose');

let MinimalMonday;
let Entry;

function getMondayQuery(date) {
  return {
    date: {
      $gte: moment(date).utc().startOf('day').toDate(),
      $lt: moment(date).utc().add(1, 'days').startOf('day').toDate()
    }
  }
}

function DAO() {}

DAO.prototype.getEntries = function getEntries(date) {
  log.debug('retrieving entries for: %s', date);
  return MinimalMonday.model
    .findOne(getMondayQuery(date))
    .populate({path: 'entries'})
    .then((day) => {
      if (!day) {
        log.debug('no data found for date: %s', date);
        return null;
      }
      log.debug('got day: %s', day.date.toISOString());
      return Promise.resolve(day.entries);
    })
    .catch((err) => {
      log.error('failed to get entries: %s', err.message);
      log.debug(err.stack);
      return Promise.reject(err);
    });
};

DAO.prototype.addEntry = function addEntry(date, entry) {
  function* generator() {
    try {
      log.debug('adding entry: (%s, %j)', date.toISOString(), entry);
      const _entry = yield Entry.model.create(entry);
      let monday = yield MinimalMonday.model
        .findOne(getMondayQuery(date)).populate({path: 'entries'});
      if (!monday) {
        monday = new MinimalMonday.model;
      }
      monday.entries.push(_entry);
      monday.markModified();
      yield monday.save();
      return _entry;
    } catch (e) {
      log.error('dao error: %s', e.message);
      log.debug(e.stack);
      throw e;
    }
  }

  return ty.spawn(generator);
};

let dao;
module.exports = function getDao() {
  if (dao) {
    return dao;
  }

  MinimalMonday = require('./MinimalMonday')(mongoose);
  Entry = require('./Entry')(mongoose);
  dao = new DAO();
  return dao;
};
