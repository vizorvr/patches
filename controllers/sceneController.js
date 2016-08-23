var Scene = require('../models/scene')
var AssetController = require('./assetController')
var SceneProcessor = require('../lib/sceneProcessor')
var fs = require('fs')
var fsPath = require('path')
var slugify = require('../models/asset-helper').slugify

var allowedExtensions = ['.zip', '.obj', '.js', '.json', '.gltf', '.fbx', '.dae']

function SceneController() {
	var args = Array.prototype.slice.apply(arguments)
	args.unshift(Scene)
	AssetController.apply(this, args)
}

SceneController.prototype = Object.create(AssetController.prototype)

SceneController.prototype.canWriteUpload = function(req, res, next) {
	var that = this

	if (!req.files)
		return next(new Error('No files uploaded'))

	var file = req.files.file
	var folder = '/' + req.user.username + '/assets/scene'
	var extless = fsPath.basename(file.name, fsPath.extname(file.name))
	var dest = folder + '/' + slugify(extless)

	that._service.canWrite(req.user, dest)
	.then(function(can) {
		if (can)
			return next()

		fs.unlink(file.path)

		return res.status(403)
			.json({message: 'Sorry, permission denied'})
	})
}

SceneController.prototype.upload = function(req, res, next) {
	var that = this
	var file = req.files.file
	var sceneRoot = '/' + req.user.username + '/assets/scene'
	var ext = fsPath.extname(file.name.toLowerCase())

	if (allowedExtensions.indexOf(ext) === -1) {
		return res.status(400)
			.json({ message: 'Please upload only ' + allowedExtensions.join(', ') })
	}

	new SceneProcessor(this._fs)
		.handleUpload(file, sceneRoot)
		.then(function(info) {
			fs.unlink(file.path)

			return that._service.save(info, req.user)
			.then(function(asset) {
				res.json(asset)
			})
		})
		.catch(function(err) {
			console.error(err, err.stack)
			fs.unlink(file.path)
			next(err)
		})
}

module.exports = SceneController
