'use strict'

const moment = require('moment')

const name = 'MinimalMonday'
let schema
function createSchema (mongoose, EntrySchemaName) {
  if (schema) {
    return schema
  }
  return new mongoose.Schema({
    date: {
      type: Date,
      required: true,
      default: moment().day(8).toDate(),
      index: true,
      unique: true
    },
    entries: [{type: mongoose.Schema.Types.ObjectId, ref: EntrySchemaName}]
  })
}

module.exports = function init (mongoose) {
  const Entry = require('./Entry')(mongoose)
  schema = createSchema(mongoose, Entry.name)
  const model = mongoose.model(name, schema)
  return {name, schema, model}
}
