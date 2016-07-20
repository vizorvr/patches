var when = require('when')
var util = require('util')
var _ = require('lodash')
var AssetService = require('./assetService')
var GraphOptimizer = require('../lib/graphOptimizer')

var fs = require('fs')
var packageJson = JSON.parse(fs.readFileSync(__dirname+'/../package.json'))
var currentPlayerVersion = packageJson.version.split('.').slice(0,2).join('.')

function GraphService(assetModel, gfs) {
	AssetService.call(this);
	this._model = assetModel;
	this._fs = gfs;
};
util.inherits(GraphService, AssetService);

GraphService.prototype.findByPath = function(path) {
	var parts = path.split('/')
	return this.findOne({
		owner: parts[1],
		name: parts[2]
	})
}

GraphService.prototype.listWithPreviews = function() {
	var dfd = when.defer()

	this._model
		.find({ deleted: false })
		.select('_creator owner name previewUrlSmall previewUrlLarge updatedAt stat')
		.sort('-updatedAt')
		.exec(function(err, list)
	{
		if (err)
			return dfd.reject(err)
		
		dfd.resolve(list)
	})

	return dfd.promise
}

GraphService.prototype.publicRankedList = function() {
	var dfd = when.defer()

	this._model
		.find({ private: false, deleted: false })
		.select('_creator private owner name previewUrlSmall updatedAt stat')
		.sort('-rank')
		.exec(function(err, list)
	{
		if (err)
			return dfd.reject(err)
		
		dfd.resolve(list)
	})

	return dfd.promise
}

/**
 * get user graphs for username. defaults to filter for non-deleted graphs only.
 * @param username string
 * @param offset int
 * @param limit int
 * @param filter object mongo filter (as in .find({...}))
 * @returns {Promise}
 * @private
 */
GraphService.prototype._userGraphs = function(username, offset, limit, filter) {
	var dfd = when.defer()

	filter = _.extend({deleted:false}, filter)
	filter.owner = username

	var query = this._model
		.find(filter)
		.sort('-updatedAt')

	if (offset)
		query.skip(offset)

	if (limit)
	 	query.limit(limit)

	query
		.select('_creator private owner name previewUrlSmall previewUrlLarge updatedAt stat views')
		.exec(function(err, list) {
			if (err)
				return dfd.reject(err)

			dfd.resolve(list)
		})

	return dfd.promise
}

GraphService.prototype.userGraphs = function(username, offset, limit) {
	return this._userGraphs(username, offset, limit)
}

// allows to filter by private graph. defaults to public graphs
GraphService.prototype.userGraphsWithPrivacy = function(username, offset, limit, isPrivate) {
	var filter = {
		'private': !!isPrivate
	}
	return this._userGraphs(username, offset, limit, filter)
}


// e.g. when toggling public/private or renaming, but not touching anything else
// opts {updatedAt, version}
GraphService.prototype._save = function(data, user, opts) {
	var that = this
	var wasNew = false

	opts = _.extend({
		version : currentPlayerVersion,
		updatedAt: Date.now()
	}, opts)

	return this.findByPath(data.path)
	.then(function(asset) {
		if (!asset) {
			wasNew = true
			asset = new that._model(data)
		}

		asset._creator = user.id
		asset.updatedAt = opts.updatedAt

		if (data.tags)
			asset.tags = data.tags

		if (data.previewUrlSmall)
			asset.previewUrlSmall = data.previewUrlSmall

		if (data.previewUrlLarge)
			asset.previewUrlLarge = data.previewUrlLarge

		if (data.stat)
			asset.stat = data.stat

		if (data.hasAudio)
			asset.hasAudio = data.hasAudio

		// by default bumps to latest player version
		asset.version = opts.version

		asset.deleted = data.deleted || false
		asset.private = data.private || false
		asset.editable = data.editable === false ? false : true

		var dfd = when.defer()

		asset.save(function(err) {
			if (err)
				return dfd.reject(err)

			if (wasNew && !user.isAnonymous)
				user.increaseProjectsCount()

			dfd.resolve(asset)
		})

		return dfd.promise
	})
}


GraphService.prototype.save = function(data, user, opts) {
	var that = this;
	var gridFsPath = '/graph'+data.path+'.json';
	var optimisedGfsPath = '/graph'+data.path+'.min.json';

	return this._save.apply(this, arguments)
	.then(function(asset) {
		if (asset.deleted)
			return asset

		// make an optimized copy
		return that._fs.readString(gridFsPath)
		.then(function(source) {
			var optimized = new GraphOptimizer()
				.graph(JSON.parse(source))
				.optimize();

			return that._fs.writeString(optimisedGfsPath, 
				JSON.stringify(optimized));
		})
		.then(function() {
			return asset;
		});
	});
};

module.exports = GraphService;

