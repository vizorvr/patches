var Preset = require('../models/preset')
var AssetController = require('./assetController')
var fsPath = require('path')
var templateCache = new(require('../lib/templateCache'))
var assetHelper = require('../models/asset-helper')

function PresetController(presetService, fs) {
	var args = Array.prototype.slice.apply(arguments)
	args.unshift(Preset)
	AssetController.apply(this, args)
}

PresetController.prototype = Object.create(AssetController.prototype)

PresetController.prototype._makePath = function(req, path) {
	return '/' + req.user.username
		+ '/' + assetHelper.slugify(fsPath.basename(path, fsPath.extname(path)))
		+ '.json'
}

PresetController.prototype._makeGridFsPath = function(req, path) {
	return '/preset'+this._makePath(req, path)
}

// POST /:username/presets
PresetController.prototype.save = function(req, res, next) {
	var that = this
	var path = this._makePath(req, req.body.name)
	var gridFsPath = this._makeGridFsPath(req, req.body.name)

	var tags = that._parseTags(req.body.tags)

	this._service.canWrite(req.user, path)
	.then(function(can) {
		if (!can) {
			return res.status(403)
				.json({message: 'Sorry, permission denied'})
		}

		return that._fs.writeString(gridFsPath, req.body.graph)
		.then(function() {
			var url = that._fs.url(gridFsPath)

			var model = {
				name: req.body.name,
				path: path,
				tags: tags,
				url: url
			}

			return that._service.save(model, req.user)
			.then(function(asset) {
				res.json(asset)
			})
		})
	})
	.catch(next)
}

module.exports = PresetController
