var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');

var sceneSchema = new mongoose.Schema(_.assign(
{
	json: { type: String, required: true },
	images: [ String ]
}, assetHelper.schema));

module.exports = mongoose.model('Scene', sceneSchema);
