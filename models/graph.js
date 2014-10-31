var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');
var _ = require('lodash');

var graphSchema = new mongoose.Schema(_.assign(
{
	url: { type: String, required: true }
}, assetHelper.schema));

graphSchema.pre('save', assetHelper.preSaveSlugify);

graphSchema.methods.slugify = assetHelper.slugify.bind(graphSchema);

module.exports = mongoose.model('Graph', graphSchema);
