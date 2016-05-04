var User = require('../models/user');
var when = require('when');

function AssetService(assetModel) {
	this._model = assetModel;
};

AssetService.prototype.list = function() {
	return this.find()
}

AssetService.prototype.count = function(q) {
	var dfd = when.defer()

	this._model
	.count(q)
	.exec(function(err, count) {
		if (err)
			return dfd.reject(err)
		
		dfd.resolve(count)
	})

	return dfd.promise
}

AssetService.prototype.buildQuery = function(q, options) {
	var query = this._model.find(q)

	if (options && options.limit)
		query = query.limit(options.limit)

	if (options && options.offset)
		query = query.skip(options.offset)

	return query
}

AssetService.prototype.find = function(q) {
	var dfd = when.defer()

	this._model.find(q)
		.sort('-updatedAt')
		.populate('_creator')
		.exec(function(err, list)
	{
		if (err)
			return dfd.reject(err)
		
		dfd.resolve(list)
	})

	return dfd.promise
}

AssetService.prototype.findByCreatorName = function(username) {
	var that = this
	var dfd = when.defer()

	User.findOne({ username: username })
	.exec(function(err, user) {
		if (err)
			return dfd.reject(err)

		if (!user)
			return dfd.resolve([])

		dfd.resolve(that.find({ '_creator': user._id }))
	})

	return dfd.promise
}

AssetService.prototype.findByCreatorId = function(userId) {
	return this.find({
		'_creator': userId
	})
}

AssetService.prototype.canWrite = function(user, path) {
	return this.findByPath(path)
	.then(function(asset) {
		if (!asset)
			return true

		var creator = asset._creator

		if (creator._id)
			creator = creator._id

		return !asset ||
			creator.toString() === user.id.toString()
	})
}

AssetService.prototype.canWriteAnonymous = function(path) {
	return this.findByPath(path)
	.then(function(asset) {
		// Asset is null, doesn't exist, we can write
		if (!asset)
			return true

		// Asset already found, can't overwrite
		return false
	})
}

AssetService.prototype.findOne = function(q) {
	var dfd = when.defer()

	this._model
		.findOne(q)
		.populate('_creator')
		.exec(function(err, item)
	{
		if (err)
			return dfd.reject(err)
		
		dfd.resolve(item)
	})

	return dfd.promise
}

AssetService.prototype.findByTagAndUserId = function(tag, userId) {
	return this.find({
		tags: tag.replace(/[^a-zA-Z0-9]/g, ''),
		_creator: userId
	})
}

AssetService.prototype.findByPath = function(path) {
	return this.findOne({ path: path })
}

AssetService.prototype.save = function(data, user) {
	var that = this;

	return this.findByPath(data.path)
	.then(function(asset) {
		if (!asset)
			asset = new that._model(data);

		asset._creator = user.id;
		asset.updatedAt = Date.now();

		if (data.tags)
			asset.tags = data.tags

		if (data.previewUrlSmall)
			asset.previewUrlSmall = data.previewUrlSmall

		if (data.previewUrlLarge)
			asset.previewUrlLarge = data.previewUrlLarge

		if (data.stat)
			asset.stat = data.stat

		var dfd = when.defer();

		asset.save(function(err) {
			if (err)
				return dfd.reject(err);

			dfd.resolve(asset);
		});

		return dfd.promise;
	});
};

module.exports = AssetService;

