var Patch = require('../models/patch')
var AssetController = require('./assetController')
var fsPath = require('path')
var assetHelper = require('../models/asset-helper')
var GraphAnalyser = require('../common/graphAnalyser').GraphAnalyser
var helper = require('./controllerHelpers')

function PatchController(patchService, fs) {
	var args = Array.prototype.slice.apply(arguments)
	args.unshift(Patch)
	AssetController.apply(this, args)

	this.graphAnalyser = new GraphAnalyser(fs)
}

PatchController.prototype = Object.create(AssetController.prototype)

PatchController.prototype._makePath = function(req, name) {
	return '/' 
		+ req.user.username
		+ '/patches/'
		+ assetHelper.slugify(
			fsPath.basename(name, fsPath.extname(name)))
		+ '.json'
}

PatchController.prototype._makeGridFsPath = function(req, path) {
	return this._makePath(req, path)
}

// POST /:username/patches
PatchController.prototype.save = function(req, res, next) {
	var that = this
	var path = this._makePath(req, req.body.name)
	var gridFsPath = this._makeGridFsPath(req, req.body.name)

	var tags = that._parseTags(req.body.tags)

	this._service.canWrite(req.user, path)
	.then(function(can) {
		if (!can) {
			return res.status(403)
				.json(helper.responseStatusError('Sorry, permission denied'))
		}

		return that.graphAnalyser.analyseJson(req.body.graph)
		.then(function(stat) {
			if (!stat.numNodes) {
				return res.status(400)
					.json(helper.responseStatusError('bad data'))
			}

			return that._fs.writeString(gridFsPath, req.body.graph)
			.then(function() {
				var url = that._fs.url(gridFsPath)

				var model = {
					category: req.body.category,
					name: req.body.name,
					type: stat.type || 'patch',
					path: path,
					tags: tags,
					stat: stat,
					url: url
				}

				console.log('Saved patch model', model)

				return that._service.save(model, req.user)
				.then(function(asset) {
					res.json(asset)
				})
			})
		})
	})
	.catch(next)
}

module.exports = PatchController
