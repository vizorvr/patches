var Image = require('../models/image')
var AssetController = require('./assetController')
var ImageProcessor = require('../lib/imageProcessor')
var User = require('../models/user')
var fs = require('fs')
var helper = require('./controllerHelpers')

function ImageController() {
	var args = Array.prototype.slice.apply(arguments)
	args.unshift(Image)
	AssetController.apply(this, args)
}

ImageController.prototype = Object.create(AssetController.prototype)

ImageController.prototype.upload = function(req, res, next) {
	var that = this

	var file = req.files.file
	var folder = '/' + req.user.username + '/assets/image'

	new ImageProcessor(this._fs)
		.handleUpload(file, folder)
		.then(function(info) {
			fs.unlink(file.path, function() {})

			info.path = info.original.path
			info.url = info.original.url

			return that._service.save(info, req.user)
			.then(function(asset) {
				res.json(asset)
			})
		})
		.catch(next)
}

ImageController.prototype.setUserAvatar = function(req, res, next) {
	var that = this

	User.findById(req.user.id, function(err, user) {
		if (err || !user)
			return next(err)

		var file = req.files.file
		var folder = '/' + req.user.username + '/profile'

		new ImageProcessor(that._fs)
			.handleAvatarUpload(file, folder)
			.then(function(info) {
				fs.unlink(file.path, function() {})

				user.profile.avatarOriginal = info.original.url
				user.profile.avatarScaled = info.scaled.url

	 			user.save(function(err) {
	 				if (err)
	 					return next(err)

	 				res.json(helper.responseStatusSuccess(
	 					'OK', {
	 						uploaded: info,
	 						user: user.toJSON()
	 					})
	 				)
	 			})
			})
			.catch(next)
	})
}

ImageController.prototype.uploadAnonymous = function(req, res, next) {
	var that = this

	var file = req.files.file
	var folder = '/v/assets/image'

	new ImageProcessor(this._fs)
		.handleUpload(file, folder)
		.then(function(info) {
			fs.unlink(file.path, function() {})

			info.path = info.original.path
			info.url = info.original.url

			return that._service.save(info, req.user)
			.then(function(asset) {
				res.json(asset)
			})
		})
		.catch(next)
}

module.exports = ImageController
