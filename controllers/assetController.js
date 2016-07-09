var User = require('../models/user');
var fsPath = require('path')
var checksum = require('checksum')
var assetHelper = require('../models/asset-helper')

function AssetController(modelClass, assetService, fs) {
	this._model = modelClass
	this._modelName = this._model.modelName.toString().toLowerCase()
	this._service = assetService
	this._fs = fs
}

AssetController.prototype.validate = function(req, res, next) {
	var asset = new this._model(req.body)

	asset.validate(function(err) {
		if (err)
			return res.status(400).json(err.errors)

		next()
	})
} 

// GET /:model
AssetController.prototype.userIndex = function(req, res, next) {
	var dfd 

	if (req.params.username === 'vizor') {
		dfd = this._service.findByCreatorName(req.params.username)
	} else {
		dfd = this._service.findByCreatorId(req.session.userId)
	}
	
	dfd.then(function(list) {
		res.json(list)
	})
	.catch(next)
}

AssetController.prototype.index = function(req, res, next) {
	this._service.list()
	.then(function(list) {
		res.json(list)
	})
	.catch(next)
}

AssetController.prototype._parseTags = function(tags) {
	if (!tags || !tags.length)
		return []

	if (!Array.isArray(tags))
		tags = tags.split(' ')

	return tags.map(function(tag) {
		return tag.replace(/[^a-zA-Z0-9]/g, '')
	})
	.filter(function(tag) {
		return tag.length > 0
	})
}

AssetController.prototype._makePath = function(req, path) {
	return '/' + fsPath.join(
		req.user.username,
		'assets',
		this._modelName,
		assetHelper.slugify(
			fsPath.basename(path, fsPath.extname(path))
		) + fsPath.extname(path)
	)
}

AssetController.prototype._makeGridFsPath = function(req) {
	var file = req.files.file
	return '/'+this._modelName+'/'+file.sha1+fsPath.extname(file.path)
}

// eg. GET /:username/presets.json
AssetController.prototype.findByCreatorName = function(req, res, next) {
	this._service
	.findByCreatorName(req.params.username)
	.then(function(list) {
		res.json(list)
	})
	.catch(next)
}

// GET /:username/assets/:model/tag/:tag
AssetController.prototype.findByTagAndUsername = function(req, res, next) {
	var that = this
	var tag = req.params.tag

	if (!tag) {
		return res.status(400).json({
			message: 'No tag given'
		})
	}

	function performFind(userId) {
		that._service.findByTagAndUserId(tag, userId)
		.then(function(list) {
			res.json(list)
		})
		.catch(next)
	}

	User.findOne({ username: req.params.username })
	.exec(function(err, user) {
		if (err)
			return next(err)

		if (!user)
			return res.json([])

		performFind(user._id)
	})
}

// GET /:model/:slug
AssetController.prototype.load = function(req, res, next) {
	this._service.findByPath(req.params.path)
	.then(function(item) {
		res.json(item)
	})
	.catch(next)
}

// POST /:model
AssetController.prototype.save = function(req, res, next) {
	var that = this

	this._service.canWrite(req.user, req.body.path)
	.then(function(can) {
		if (!can) {
			return res.status(403).json({
				message: 'Sorry, permission denied'
			})
		}

		return that._service.save(req.body, req.user)
		.then(function(asset) {
			asset.tags = that._parseTags(req.body.tags)
			res.json(asset)
		})
	})
}

AssetController.prototype.checksumUpload = function(req, res, next) {
	if (!req.files || !req.files.file)
		return next(new Error('No files uploaded'));

	checksum.file(req.files.file.path, function(err, sum) {
		if (err)
			return next(err)

		req.files.file.sha1 = sum

		next()
	})
}

AssetController.prototype.canWriteUpload = function(req, res, next) {
	var that = this;

	if (!req.files)
		return next(new Error('No files uploaded'))

	var file = req.files.file
	var dest = this._makePath(req, file.path)

	that._service.canWrite(req.user, dest)
	.then(function(can)
	{
		if (!can)
			return res.status(403)
				.json({message: 'Sorry, permission denied'})

		next()
	})
} 

AssetController.prototype.canWriteUploadAnonymous = function(req, res, next) {
	var that = this;

	if (!req.files)
		return next(new Error('No files uploaded'))

	var file = req.files.file

	// Fake the user
	req.user = {
		username: 'v'
	}
	var dest = this._makePath(req, file.path)

	that._service.canWriteAnonymous(dest)
	.then(function(can)
	{
		if (!can)
			return res.status(403)
				.json({message: 'Sorry, permission denied'})

		next()
	})
} 

AssetController.prototype.upload = function(req, res, next) {
	var that = this

	var file = req.files.file
	var path = this._makePath(req, file.path)
	var gridFsPath = this._makeGridFsPath(req)

	return that._service.canWrite(req.user, path)
	.then(function(can) {
		if (!can)
			return res.status(403)
				.json({message: 'Sorry, permission denied'})

		// move the uploaded file into GridFS / local FS
		return that._fs.move(file.path, gridFsPath)
		.then(function(url) {
			return that._service.findByPath(path)
			.then(function(model) {
				if (!model)
					model = { path: path }

				model.url = url

				// save/update the model
				return that._service.save(model, req.user)
				.then(function(asset) {
					res.json(asset)
				})
			})
		})
	})
	.catch(function(err)
	{
		return next(err)
	})
}

module.exports = AssetController
