var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');

var jsonSchema = new mongoose.Schema(Object.create(assetHelper.schema,
{
	url: { type: String, required: true }
}));

jsonSchema.pre('save', assetHelper.preSaveSlugify);

jsonSchema.methods.slugify = assetHelper.slugify.bind(jsonSchema);

module.exports = mongoose.model('JSON', jsonSchema);
