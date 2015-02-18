var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');
var _ = require('lodash');

var presetSchema = new mongoose.Schema(_.assign({
	name: { type: String, required: true }
}, assetHelper.schema), {});

module.exports = mongoose.model('Preset', presetSchema);
