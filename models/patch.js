var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');
var _ = require('lodash');

var patchSchema = new mongoose.Schema(_.assign({
	category: { type: String },
	name: { type: String, required: true },
	type: { type: String, required: true },
	stat: { type: Schema.Types.Mixed, required: true }
}, assetHelper.schema), {});

module.exports = mongoose.model('Patch', patchSchema);
