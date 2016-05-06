'use strict';

const name = 'Entry';
let schema;
function createSchema(mongoose) {
  if (schema) {
    return schema;
  }
  return new mongoose.Schema({
    submitted: {type: Date, required: true, default: new Date()},
    facebookName: {type: String, required: true, index: true},
    artist: {type: String, required: true, index: true},
    url: {type: String, required: true, index: true},
    description: {type: String, required: false},
    kind: {
      type: String,
      required: true,
      index: true,
      enum: [ 'soundcloud', 'hearthis', 'other' ]
    }
  });
}

module.exports = function init(mongoose) {
  schema = createSchema(mongoose);
  const model = mongoose.model(name, schema);
  return {name, schema, model};
};
