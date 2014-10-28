var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');

var sizeSchema = new mongoose.Schema(
{
	width: { type: Number, required: true },
	height: { type: Number, required: true },
	bpp: { type: Number, required: true },
	url: { type: String, required: true }
});

var imageSchema = new mongoose.Schema(Object.create(assetHelper.schema,
{
	sizes: [ sizeSchema ]
}));

imageSchema.pre('save', assetHelper.preSaveSlugify);

imageSchema.methods.slugify = assetHelper.slugify.bind(imageSchema);

module.exports = mongoose.model('Image', imageSchema);
