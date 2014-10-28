var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');

var videoSchema = new mongoose.Schema(Object.create(assetHelper.schema,
{
	url: { type: String, required: true },
	thumbnail: { type: String, required: true },
	size: Number,
	length: Number,
	width: Number,
	height: Number
}));

videoSchema.pre('save', assetHelper.preSaveSlugify);

videoSchema.methods.slugify = assetHelper.slugify.bind(videoSchema);

module.exports = mongoose.model('Video', videoSchema);
