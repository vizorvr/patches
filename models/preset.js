var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');
var _ = require('lodash');

var presetSchema = new mongoose.Schema(_.assign({
	category: { type: String, required: true },
	name: { type: String, required: true },
	type: { type: String, required: true },
	stat: { type: Schema.Types.Mixed, required: true }
}, assetHelper.schema), {});

module.exports = mongoose.model('Preset', presetSchema);
