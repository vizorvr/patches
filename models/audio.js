var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');

var audioSchema = new mongoose.Schema(Object.create(assetHelper.schema,
{
	bytes: Number,
	mimetype: String,
	length: Number
}));

module.exports = mongoose.model('Audio', audioSchema);
