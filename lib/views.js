'use strict';

const path = require('path');
const marko = require('marko');
const markoCompiler = require('marko/compiler');
markoCompiler.defaultOptions.writeToDisk = false;

const tmplDir = path.join(path.resolve(__dirname, '..', 'templates'));
const layoutTmpl = marko.load(path.join(tmplDir, 'layout.marko'));

const slash = function slashView(context) {
  const tmpl = marko.load(path.join(tmplDir, 'slash.marko'));
  const _context = Object.assign({layout: layoutTmpl}, context);
  return tmpl.stream(_context);
};

const addForm = function addFormView(context) {
  const tmpl = marko.load(path.join(tmplDir, 'submit.marko'));
  const _context = Object.assign({layout: layoutTmpl}, context);
  return tmpl.stream(_context);
};

const entryAdded = function entryAdded(context) {
  const tmpl = marko.load(path.join(tmplDir, 'entryAdded.marko'));
  const _context = Object.assign({layout: layoutTmpl}, context);
  return tmpl.stream(_context);
};

module.exports = {slash, addForm, entryAdded};
