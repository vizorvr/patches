var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var assetHelper = require('./asset-helper');
var _ = require('lodash');

var graphSchema = new mongoose.Schema(_.assign({}, assetHelper.schema));

module.exports = mongoose.model('Graph', graphSchema);
