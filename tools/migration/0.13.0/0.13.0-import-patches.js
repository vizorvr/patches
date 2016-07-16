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
var importedPatches = 0

function makePath(name) {
	return '/vizor/patches/'
		+ assetHelper.slugify(
			fsPath.basename(name, fsPath.extname(name)))
		+ '.json'
}

function preparePatches() {
	var dfd = when.defer()
	var patches = []
	var patchesObject = JSON.parse(fs.readFileSync(
		patchesRoot + 'patches.json'))
	var patchCategories = Object.keys(patchesObject)

	// each category
	return when.map(patchCategories, function(cat) {
		var patchTitles = Object.keys(patchesObject[cat])
		// each title in category
		return when.map(patchTitles, function(patchTitle) {
			// analyse the patch
			var patch = patchesObject[cat][patchTitle]
			var patchGraph = JSON.parse(
				fs.readFileSync(patchesRoot + patch.name + '.json')
			)

			var pg = patchGraph.root ? patchGraph.root : patchGraph
	
			return graphAnalyser.parseAssets(pg)
			.then(function(stat) {
				var patch = {
					category: cat,
					name: patchTitle,
					type: stat.type,
					stat: stat,
					path: makePath(patchesObject[cat][patchTitle].name),
					patch: pg
				}

				patches.push(patch)
			})
		})
	})
	.then(function() {
		console.log('  found', patches.length, 'patches')
		return patches
	})
}

function writePatch(vizorUserId, patch) {
	var dfd = when.defer()
	var gridFsPath = patch.path
	var that = this

	gfs.writeString(gridFsPath, JSON.stringify(patch.patch))
	.then(function() {
		var url = gfs.url(gridFsPath)

		Patch.findOne({ path: patch.path })
		.then(function(found) {
			var patchModelData = {
				_creator: vizorUserId,
				category: patch.category,
				name: patch.name,
				path: patch.path,
				type: patch.stat.type,
				stat: patch.stat,
				url: url
			}

			var patchModel

			if (found)
				patchModel = found
			else
				patchModel = new Patch({})

			_.assign(patchModel, patchModelData)

			patchModel.save(function(err) {
				if (err)
					return dfd.reject(err)

				importedPatches++

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
			User.findOne({ username: 'vizor' }, function(err, vizorUser) {
				if (err || !vizorUser)
					return done(err)

				var vizorUserId = vizorUser.id

				graphAnalyser = new GraphAnalyser(gfs)

				preparePatches()
				.then(function(patches) {
					return when.map(patches, function(patch) {
						return writePatch(vizorUserId, patch)
					})
				})
				.then(function() {
					console.log('  imported', importedPatches, 'patches')
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
