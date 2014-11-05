var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');
var _ = require('lodash');

var sceneSchema = new mongoose.Schema(_.assign({
	files: [String]
}, assetHelper.schema));

module.exports = mongoose.model('Scene', sceneSchema);
