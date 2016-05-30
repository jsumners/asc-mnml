'use strict'

const moment = require('moment')

module.exports = function seed (mongoose) {
  const EntryModel = mongoose.model('Entry')
  const MinimalMondayModel = mongoose.model('MinimalMonday')

  const thisMonday = moment().day(1)
  const lastMonday = moment().day(1 - 7)

  MinimalMondayModel
    .create({
      date: lastMonday.startOf('day').toDate(),
      entries: []
    })
    .then((monday) => {
      const entries = []
      entries.push({
        submitted: lastMonday.day(-1).toDate(),
        facebookName: 'Foo Bar',
        artist: 'foobar',
        url: 'http://foobar.example.com',
        description: 'hello world',
        kind: 'other'
      })
      entries.push({
        submitted: lastMonday.toDate(),
        facebookName: 'Bar Baz',
        artist: 'barbaz',
        url: 'http://barbaz.example.com',
        kind: 'other'
      })
      return EntryModel
        .insertMany(entries)
        .then((entries) => {
          monday.entries = entries
          return monday.save()
        })
    })
  
  return MinimalMondayModel
    .create({
      date: thisMonday.startOf('day').toDate(),
      entries: []
    })
    .then((monday) => {
      const entries = []
      entries.push({
        submitted: thisMonday.day(-1).toDate(),
        facebookName: 'Foo Bar',
        artist: 'foobar',
        url: 'http://foobar.example.com',
        description: 'hello world',
        kind: 'other'
      })
      entries.push({
        submitted: thisMonday.toDate(),
        facebookName: 'Bar Baz',
        artist: 'barbaz',
        url: 'http://barbaz.example.com',
        kind: 'other'
      })
      return EntryModel
        .insertMany(entries)
        .then((entries) => {
          monday.entries = entries
          return monday.save()
        })
    })
}
