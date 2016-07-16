var fs = require('fs')
var fsPath = require('path')
var secrets = require('../../../config/secrets')
var mongoose = require('mongoose')
var when = require('when')
var nodefn = require('when/node')
var _ = require('lodash')
var GridFsStorage = require('../../../lib/gridfs-storage');
var GraphAnalyser = require('../../../common/graphAnalyser').GraphAnalyser

var User = require('../../../models/user')
var Patch = require('../../../models/patch')
var assetHelper = require('../../../models/asset-helper')

var patchesRoot = fsPath.resolve(__dirname 
	+ '/../../../browser/patches/') 
	+ '/'

var gfs
var graphAnalyser
var fixedPatches = 0

function makePath(username, patchName) {
	return '/'+username+'/patches/'
		+ assetHelper.slugify(
			fsPath.basename(patchName, fsPath.extname(patchName)))
		+ '.json'
}

function sanitisePatch(patch) {
	var dfd = when.defer()

	var fixedPath = makePath(patch._creator.username, patch.path)
	var relativeUrl = patch.url.substring(5)

	function doPatch(patchFile) {
		var patchGraph = {}

		try {
			patchGraph = JSON.parse(patchFile)
		} catch(e) {}

		var pg = patchGraph.root ? patchGraph.root : patchGraph

		return graphAnalyser.parseAssets(pg)
		.then(function(stat) {
			patch.type = stat.type
			patch.stat = stat
			patch.originalPath = patch.path
			patch.originalUrl = patch.url
			patch.path = makePath(patch._creator.username, patch.path)
			patch.patch = pg

			if (['entity', 'entity_component'].indexOf(stat.type) > -1) {
				pg.nodes[0].plugin = stat.type
			}

			return patch
		})
	}

	function readPatch(filename) {
		return gfs.readString(filename)
		.catch(function(err) {
			console.log('READ ERROR', filename)
			console.error(err.stack)
		})
		.then(doPatch)
	}

	return gfs.exists(fixedPath)
	.then(function(exists) {
		if (exists) {
			return readPatch(fixedPath)
		} else {
			return gfs.exists(relativeUrl)
			.then(function(exists) {
				if (exists)
					return readPatch(relativeUrl)

				console.log('not found', patch.path)
			})
		}

	})
}

function writePatch(patch) {
	var dfd = when.defer()
	var gridFsPath = patch.path
	var that = this

	gfs.writeString(gridFsPath, JSON.stringify(patch.patch))
	.then(function() {
		var url = gfs.url(gridFsPath)

		Patch.findOne({ _id: patch._id })
		.then(function(patchModel) {
			var patchModelData = {
				category: patch.category || 'MY PATCHES',
				path: patch.path,
				type: patch.stat.type,
				stat: patch.stat,
				url: url
			}

			_.assign(patchModel, patchModelData)

			if (patch.originalPath !== patch.path) {
				gfs.unlink(patch.originalUrl.substring(5))
				.catch(function() {})
			}

			patchModel.save(function(err) {
				if (err)
					return dfd.reject(err)

				fixedPatches++

				return dfd.resolve()
			})
		})
	})

	return dfd.promise
}

// migrate the graphs and patches in the db
exports.execute = function() {
	var dfd = when.defer()

	function done(err) {
		mongoose.disconnect()
		gfs.close()

		if (err) {
			console.error('ERROR: ', err.stack)
			return dfd.reject(err)
		}

		dfd.resolve()
	}

	mongoose.connect(secrets.db)

	mongoose.connection.on('connected', function() {
		gfs = new GridFsStorage('/data')
		gfs.on('ready', function() {
			Patch.find({})
			.populate('_creator')
			.exec(function(err, patches) {
				if (err || !patches)
					return done(err)

				console.log('patches', patches.length)

				graphAnalyser = new GraphAnalyser(gfs)

				return when.map(patches, function(patch) {
					return sanitisePatch(patch)
					.then(function() {
						return writePatch(patch)
					})
					.catch(function(err) {
						console.error(err)
					})
				})
				.then(function() {
					console.log('  did', fixedPatches, 'patches')
					done()
				})
				.catch(done)
			})
		})
	})

	mongoose.connection.on('error', done)

	return dfd.promise
}

if (require.main === module)
	exports.execute()
