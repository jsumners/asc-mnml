'use strict'
/* eslint-env node, mocha */

const path = require('path')
const expect = require('chai').expect
const moment = require('moment')
const mongoose = require('mongoose')
const mockgoose = require('mockgoose')

delete require.cache.laic
const ioc = require('laic').laic.addNamespace('asc')
const pino = require('pino')
const logger = pino({level: 'fatal'})
ioc.register('logger', logger, false)

const daoPath = path.resolve(path.join(__dirname, '..', 'lib', 'dao'))

require('thunk-mocha')()
suite('dao tests', function daoTests () {
  suiteSetup(function (done) {
    mockgoose(mongoose)
      .then((connectString) =>
        Promise.resolve(mongoose.connect(connectString))
      )
      .then(() => {
        ioc.register('mongoose', mongoose, false)
      })
      .then(() => {
        require(path.join(__dirname, '..', 'lib', 'Entry'))(mongoose)
        require(path.join(__dirname, '..', 'lib', 'MinimalMonday'))(mongoose)
      })
      .then(() => require('./fixtures/seedData')(mongoose))
      .then(() => done())
      .catch(done)
  })

  suiteTeardown(function (done) {
    mongoose.disconnect().then(done)
  })

  let getDao
  setup(function (done) {
    delete require.cache[daoPath]
    getDao = require(daoPath)
    done()
  })

  suite('internals#getMondayQuery', function () {
    test('get monday query is correct', function (done) {
      const monday = new Date('2016-05-23 14:00')
      const query = getDao.internals.getMondayQuery(monday)
      expect(moment(query.date.$gte).isBefore(monday, 'day')).to.be.true
      expect(moment(query.date.$lt).utc().isAfter(monday, 'day')).to.be.true
      done()
    })
  })

  suite('#getEntries', function () {
    test('rejects getting entries for a tuesday', function * () {
      const thisTuesday = moment().day(2)
      try {
        yield getDao().getEntries(thisTuesday.toDate())
      } catch (err) {
        expect(err).to.not.be.undefined
        expect(err.message).to.contain('must be a')
        expect(err.isMonday).to.be.false
      }
    })

    test('retrieves entries for a given monday', function * () {
      const thisMonday = moment().day(1)
      const entries = yield getDao().getEntries(thisMonday.toDate())
      expect(entries).to.not.be.null
      expect(entries.length).to.equal(2)
      expect(entries[ 0 ].facebookName).to.equal('Foo Bar')
    })
  })

  suite('#addEntry', function () {
    test('creates entries for next monday', function * () {
      const nextMonday = moment().day(1 + 7).startOf('day').utc()
      const thisTuesday = moment().day(2).hour(14).minute(0)

      let monday = yield getDao().getNextDay(thisTuesday.toDate())
      expect(monday).to.be.null

      const entry = yield getDao().addEntry(nextMonday.toDate(), {
        submitted: thisTuesday.toDate(),
        facebookName: 'Foo Bar',
        artist: 'foobar',
        url: 'http://foobar.example.com',
        kind: 'other'
      })
      expect(entry._id).to.exist
      expect(thisTuesday.isSame(entry.submitted)).to.be.true

      monday = yield getDao().getNextDay(thisTuesday.toDate())
      expect(monday).to.not.be.null
      expect(nextMonday.isSame(monday.date, 'day')).to.be.true
    })
  })

  suite('#getPreviousDay', function () {
    test('gets previous monday on a sunday', function * () {
      const thisSunday = moment().day(0)
      const prevMonday = yield getDao().getPreviousDay(thisSunday.toDate())
      expect(prevMonday).to.not.be.null
      expect(thisSunday.day(1 - 7).isSame(prevMonday.date, 'day')).to.be.true
      expect(prevMonday.entries.length).to.equal(2)
    })

    test('gets current monday on a tuesday', function * () {
      const thisTuesday = moment().day(2)
      const thisMonday = yield getDao().getPreviousDay(thisTuesday.toDate())
      expect(thisMonday).to.not.be.null
      expect(thisTuesday.day(1).isSame(thisMonday.date, 'day')).to.be.true
      expect(thisMonday.entries.length).to.equal(2)
    })

    test('gets previous monday on a monday', function * () {
      const mondayDate = moment().day(1)
      const thisMonday = yield getDao().getPreviousDay(mondayDate.toDate())
      expect(thisMonday).to.not.be.null
      expect(mondayDate.isAfter(thisMonday.date, 'day')).to.be.true
      expect(thisMonday.entries.length).to.equal(2)
    })
  })

  suite('#getNextDay', function () {
    test('gets upcoming monday from a sunday', function * () {
      const sunday = moment().day(0)
      const nextMonday = yield getDao().getNextDay(sunday.toDate())
      expect(nextMonday).to.not.be.null
      expect(moment(nextMonday.date).isSame(sunday.day(1), 'day')).to.be.true
    })
    test('gets next monday from a monday', function * () {
      const monday = moment().day(1)
      const nextMonday = yield getDao().getNextDay(monday.toDate())
      expect(nextMonday).to.not.be.null
      expect(moment(nextMonday.date).isSame(monday.add(7, 'days'), 'day')).to.be.true
    })

    test('gets next monday from a tuesday', function * () {
      const tuesday = moment().day(2)
      const nextMonday = yield getDao().getNextDay(tuesday.toDate())
      expect(nextMonday).to.not.be.null
      expect(moment(nextMonday.date).isSame(moment().day(1 + 7), 'day')).to.be.true
    })

    test('returns null for missing monday', function * () {
      const tuesday3 = moment().day(2 + 14)
      const monday4 = yield getDao().getNextDay(tuesday3.toDate())
      expect(monday4).to.be.null
    })
  })
})
