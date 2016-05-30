'use strict'
/* eslint no-unused-vars: "warn" */

// This was the hard way widgets are easy. But maybe it'll be useful in the future.

const URL = require('url')
const RestPromise = require('rest-promise')
const ioc = require('laic').laic.asc
const log = ioc.get('logger').child({component: 'soundcloud'})
const clientId = ioc.get('config').soundcloud.clientId
const baseUrl = 'http://api.soundcloud.com'

function getUserTracks (username) {
  log.debug('retrieving tracks for user: %s', username)
  const request = new RestPromise(`${baseUrl}/users/:username/tracks?client_id=${clientId}`)
  return request
    .pathParams({username})
    .get()
}

function getTrack (trackId) {
  log.debug('retrieving track: %s', trackId)
  const request = new RestPromise(`${baseUrl}/tracks/:id?client_id=${clientId}`)
  return request
    .pathParams({trackId})
    .get()
}

function getEntry (url) {
  const _url = URL.parse(url)
  log.debug('getting soundcloud entry: %s', _url.pathname)
  const parts = _url.pathname.substr(1).split('/')
  const username = parts[0]
  const permalink = parts[1]
  return getUserTracks(username)
    .then((tracks) => {
      const track = tracks.reduce((t) => t.permalink === permalink)
    })
}
