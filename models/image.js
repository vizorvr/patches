var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');
var _ = require('lodash');

var sizeSpec = 
{
	url: { type: String, required: true },
	path: { type: String, required: true },
	width: { type: Number, required: true },
	height: { type: Number, required: true },
	bytes: Number,
	mimetype: String
};

var imageSchema = new mongoose.Schema(_.assign(
{
	original: _.clone(sizeSpec),
	scaled: _.clone(sizeSpec),
	scaledThumbnail: _.clone(sizeSpec),
}, assetHelper.schema));

module.exports = mongoose.model('Image', imageSchema);
