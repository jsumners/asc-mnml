'use strict'

module.exports.shortUrlTrackId = function suti (url) {
  return /\/([0-9]+)\//.exec(url)[1]
}
