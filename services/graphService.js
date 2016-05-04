var when = require('when');
var util = require('util');
var AssetService = require('./assetService');
var GraphOptimizer = require('../lib/graphOptimizer');

var fs = require('fs')
var packageJson = JSON.parse(fs.readFileSync(__dirname+'/../package.json'))
var currentPlayerVersion = packageJson.version.split('.').slice(0,2).join('.')

function GraphService(assetModel, gfs) {
	AssetService.call(this)
	this._model = assetModel
	this._fs = gfs
}

util.inherits(GraphService, AssetService)

GraphService.prototype.publicList = function() {
	return this.find({ private: false })
}

GraphService.prototype.findByPath = function(path) {
	var parts = path.split('/')
	return this.findOne({ owner: parts[1], name: parts[2] })
}

GraphService.prototype.listWithPreviews = function() {
	var dfd = when.defer();
	this._model
	.find()
	.select('_creator owner name previewUrlSmall updatedAt stat')
	.sort('-updatedAt')
	.exec(function(err, list) {
		if (err)
			return dfd.reject(err)
		
		dfd.resolve(list)
	})

	return dfd.promise
}

GraphService.prototype.publicRankedList = function(options) {
	var that = this

	var q = { private: false }

	return this.count(q)
	.then(function(totalCount) {
		var dfd = when.defer()

		that.buildQuery(q, options)
		.select('_creator private owner name previewUrlSmall updatedAt stat')
		.sort('-rank')
		.exec(function(err, list) {
			if (err)
				return dfd.reject(err)
			
			return dfd.resolve({
				meta: {
					page: options.page,
					pages: Math.ceil(totalCount / options.limit),
					totalCount: totalCount,
				},
				result: list
			})
		})

		return dfd.promise
	})
}

GraphService.prototype.publicUserGraphs = function(username, options) {
	var that = this
	var dfd = when.defer()

	var q = { owner: username, private: false }

	return this.count(q)
	.then(function(totalCount) {
		var dfd = when.defer()

		that.buildQuery(q, options)
		.select('_creator owner name previewUrlSmall updatedAt stat')
		.sort('-updatedAt')
		.exec(function(err, list) {
			if (err)
				return dfd.reject(err)

			return dfd.resolve({
				meta: {
					page: options.page,
					pages: Math.ceil(totalCount / options.limit),
					totalCount: totalCount
				},
				result: list
			})
		})
	
		return dfd.promise
	})
}

GraphService.prototype.myGraphs = function(username, options) {
	var that = this
	var dfd = when.defer()

	var q = { owner: username }

	return this.count(q)
	.then(function(totalCount) {
		var dfd = when.defer()

		that.buildQuery(q, options)
		.select('_creator owner name previewUrlSmall updatedAt stat')
		.sort('-updatedAt')
		.exec(function(err, list) {
			if (err)
				return dfd.reject(err)

			return dfd.resolve({
				meta: {
					page: options.page,
					pages: Math.ceil(totalCount / options.limit),
					totalCount: totalCount
				},
				result: list
			})
		})
	
		return dfd.promise
	})
}

GraphService.prototype._save = function(data, user) {
	var that = this

	return this.findByPath(data.path)
	.then(function(asset) {
		if (!asset)
			asset = new that._model(data)

		asset._creator = user.id
		asset.updatedAt = Date.now()

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

		asset.version = currentPlayerVersion
		asset.editable = data.editable === false ? false : true
		asset.private = data.private || false

		var dfd = when.defer()

		asset.save(function(err) {
			if (err)
				return dfd.reject(err)

			dfd.resolve(asset)
		})

		return dfd.promise
	})
}


GraphService.prototype.save = function(data, user) {
	var that = this;
	var gridFsPath = '/graph'+data.path+'.json';
	var optimisedGfsPath = '/graph'+data.path+'.min.json';

	return this._save.apply(this, arguments)
	.then(function(asset) {
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

