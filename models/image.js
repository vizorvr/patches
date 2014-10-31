var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');
var _ = require('lodash');

var sizeSpec = 
{
	name: { type: String, required: true },
	width: { type: Number, required: true },
	height: { type: Number, required: true },
	bytes: Number,
	mimetype: String,
	url: { type: String, required: true }
};

var imageSchema = new mongoose.Schema(_.assign(
{
	original: _.clone(sizeSpec),
	thumbnail: _.clone(sizeSpec),
	scaled: _.clone(sizeSpec),
	scaledThumbnail: _.clone(sizeSpec),
}, assetHelper.schema));

imageSchema.pre('save', assetHelper.preSaveSlugify);

imageSchema.methods.slugify = assetHelper.slugify;

module.exports = mongoose.model('Image', imageSchema);
