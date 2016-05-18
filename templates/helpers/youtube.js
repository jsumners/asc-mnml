'use strict'

const URL = require('url')

module.exports.getYouTubeId = function getYouTubeId (url) {
  const _url = URL.parse(url, true)
  return _url.query.v
}
