var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');

var audioSchema = new mongoose.Schema(Object.create(assetHelper.schema,
{
	url: { type: String, required: true },
	size: Number,
	mimetype: String,
	length: Number
}));

audioSchema.pre('save', assetHelper.preSaveSlugify);

audioSchema.methods.slugify = assetHelper.slugify.bind(audioSchema);

module.exports = mongoose.model('Audio', audioSchema);
