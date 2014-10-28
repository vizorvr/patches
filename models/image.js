var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');

var sizeSchema = new mongoose.Schema(
{
	name: { type: String, required: true },
	width: { type: Number, required: true },
	height: { type: Number, required: true },
	bpp: Number,
	size: Number,
	url: { type: String, required: true }
});

var imageSchema = new mongoose.Schema(Object.create(assetHelper.schema,
{
	sizes: [ sizeSchema ]
}));

imageSchema.pre('save', assetHelper.preSaveSlugify);

imageSchema.methods.slugify = assetHelper.slugify;

module.exports = mongoose.model('Image', imageSchema);
