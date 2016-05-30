'use strict'

const Joi = require('joi')
const Remarkable = require('remarkable')
const md = new Remarkable({linkify: true})
const ty = require('then-yield')
const moment = require('moment')
const introduce = require('introduce')(__dirname)
const views = introduce('../views')
const dao = introduce('../dao')()

function getKind (url) {
  if (url.indexOf('soundcloud') > -1 || url.indexOf('snd.sc') > -1) {
    return 'soundcloud'
  }
  if (url.indexOf('hearthis') > -1) {
    return 'hearthis'
  }
  if (url.indexOf('youtube') > -1 || url.indexOf('youtu.be') > -1) {
    return 'youtube'
  }
  return 'other'
}

function getMinimalMondayDate () {
  const currentDate = moment()
  let monday
  if (currentDate.isSame(moment().day(0), 'day')) {
    // sumission time is Sunday prior
    monday = currentDate.day(1).startOf('day')
  }
  if (currentDate.isAfter(currentDate.day(1))) {
    // submission time is Tuesday - Saturday, so return next Monday
    monday = currentDate.day(1 + 7).startOf('day')
  } else {
    // submission time is on the current Minimal Monday
    monday = currentDate.startOf('day')
  }
  return monday
}

const addGet = {
  path: '/add/entry',
  method: 'GET',
  handler (req, reply) {
    req.log(['add-entry', 'trace'], 'got add entry GET request')
    reply(views.addForm())
  }
}

const addPost = {
  path: '/add/entry',
  method: 'POST',
  handler (req, reply) {
    req.log(['add-entry', 'trace'], 'got add entry POST request')

    function * generator () {
      const minimalMondayDate = getMinimalMondayDate()
      const submission = {
        artist: req.payload.artist,
        facebookName: req.payload.facebookName,
        url: req.payload.link,
        kind: getKind(req.payload.link),
        description: req.payload.description || null
      }
      if (submission.description) {
        submission.description = md.render(submission.description)
      }

      try {
        const entry = yield dao.addEntry(minimalMondayDate.toDate(), submission)
        req.log(['add-entry', 'trace'], `entry added: ${JSON.stringify(entry)}`)
        reply(views.entryAdded({entry})).type('text/html')
      } catch (err) {
        req.log(['add-entry', 'error'], `failed to add entry: ${err.message}`)
        req.log(['add-entry', 'debug'], err.stack)
        reply(err)
      }
    }

    return ty.spawn(generator)
  },
  config: {
    validate: {
      payload: {
        artist: Joi.string().required(),
        facebookName: Joi.string().required(),
        link: Joi.string().uri().required(),
        description: Joi.any()
      }
    }
  }
}

module.exports = [addGet, addPost]
module.exports.internals = {getKind, getMinimalMondayDate}
