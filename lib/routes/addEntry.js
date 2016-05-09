'use strict';

const Joi = require('joi');
const moment = require('moment');
const marked = require('marked');
const ioc = require('laic').laic.asc;
const log = ioc.get('logger').child({route: 'slash'});
const introduce = require('introduce')(__dirname);
const views = introduce('../views');
const dao = introduce('../dao')();

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  breaks: true,
  smartypants: true
});

function getKind(url) {
  if (url.indexOf('soundcloud') > -1 || url.indexOf('snd.sc') > -1) {
    return 'soundcloud';
  }
  if (url.indexOf('hearthis') > -1) {
    return 'hearthis';
  }
  if (url.indexOf('youtube') > -1 || url.indexOf('youtu.be') > -1) {
    return 'youtube';
  }
  return 'other';
}

const addGet = {
  path: '/add/entry',
  method: 'GET',
  handler(req, reply) {
    log.debug('got add entry request');
    reply(views.addForm());
  }
};

const addPost = {
  path: '/add/entry',
  method: 'POST',
  handler(req, reply) {
    let date = moment().day(1);
    if (!moment().day(8).isSame(date, 'day') && !date.isSame(new Date(), 'day')) {
      // Must be after a Monday so set to next Monday.
      date = moment().day(8);
    }

    const artist = req.payload.artist;
    const facebookName = req.payload.facebookName;
    const url = req.payload.link;
    const kind = getKind(url);
    let description = req.payload.description;
    if (description) {
      description = marked(description);
    }

    dao
      .addEntry(date.toDate(), {artist, facebookName, url, kind, description})
      .then((entry) => {
        log.debug('entry added: %j', entry);
        reply(views.entryAdded({entry})).type('text/html');
      })
      .catch((err) => {
        log.error('failed to add entry: %s', err.message);
        log.debug(err.stack);
        reply(err);
      });
  },
  config: {
    validate: {
      payload: {
        artist: Joi.string().required(),
        facebookName: Joi.string().required(),
        link: Joi.string().uri().required(),
        description: Joi.string().default(null)
      }
    }
  }
};

module.exports = [addGet, addPost];
