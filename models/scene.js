var fsPath = require('path')
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');
var _ = require('lodash');

var sceneSchema = new mongoose.Schema(_.assign({
	files: [String],
	type: String,
	manifest: Schema.Types.Mixed
}, assetHelper.schema), {
	toObject: { virtuals: true },
	toJSON: { virtuals: true }
})

sceneSchema.virtual('name').get(function() {
	return fsPath.basename(this.path)
})

module.exports = mongoose.model('Scene', sceneSchema);
