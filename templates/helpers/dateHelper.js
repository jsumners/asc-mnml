'use strict';

const moment = require('moment');

module.exports.toUriSlug = function toUriSlug(date) {
  return moment(date).day(1).format('YYYY-MM-DD');
};
