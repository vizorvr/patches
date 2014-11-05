var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');

var videoSchema = new mongoose.Schema(_.assign(
{
	thumbnail: { type: String, required: true },
	bytes: Number,
	length: Number,
	fps: Number,
	width: Number,
	height: Number
}, assetHelper.schema));

module.exports = mongoose.model('Video', videoSchema);
