var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');

var sceneTextureSchema = {
	url: { type: String, required: true }
}

var sceneSchema = new mongoose.Schema(Object.create(assetHelper.schema,
{
	json: { type: String, required: true },
	images: [ sceneTextureSchema ]
}));

sceneSchema.pre('save', assetHelper.preSaveSlugify);

sceneSchema.methods.slugify = assetHelper.slugify.bind(sceneSchema);

module.exports = mongoose.model('Scene', sceneSchema);
