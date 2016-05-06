'use strict';

const fs = require('fs');
const introduce = require('introduce')(__dirname);

const exclude = [
  'index.js'
];

let routes = [];
const files = fs.readdirSync(__dirname);
for (const file of files) {
  if (exclude.indexOf(file) > -1) {
    continue;
  }
  routes = routes.concat(introduce(`./${file}`));
}

module.exports = routes;
