var _ = require('lodash')
var Graph = require('../models/graph')
var AssetController = require('./assetController')
var fsPath = require('path')
var assetHelper = require('../models/asset-helper')

var templateCache = require('../lib/templateCache').templateCache

var helper = require('./controllerHelpers')
var isStringEmpty = require('../lib/stringUtil').isStringEmpty
var PreviewImageProcessor = require('../lib/previewImageProcessor');

var GraphAnalyser = require('../common/graphAnalyser').GraphAnalyser
var SerialNumber = require('redis-serial')

var User = require('../models/user')
var EditLog = require('../models/editLog')

var redis = require('redis')

var secrets = require('../config/secrets')
var Hashids = require('hashids')
var hashids = new Hashids(secrets.sessionSecret)

var fs = require('fs')
var packageJson = JSON.parse(fs.readFileSync(__dirname+'/../package.json'))

function renderError(status, res, message) {
	res.status(status).render('error', {
		message: message || 'Not found'
	})
}

function visitorIsUser(req, user) {
	if (!(req && req.user && user))
		return false
	var myUid = user._id
	var theirUid = req.user._id
	return myUid && theirUid && (myUid.toString() === theirUid.toString())
}

function ownsGraph(user, graph) {
	return user && graph && user.username && graph.owner && (user.username === graph.owner)
}

function isGraphOwner(user, graph) {
	return user && (user.isAdmin ||
		((user.id === graph._creator.id) ||
		(user.id === graph._creator.toString())))
}

function makeHashid(serial) {
	return hashids.encode(serial)
}

function makeCardName(cardName) {
	var maxLen = 22
	var nameParts = cardName.split(' ')
	var name = nameParts.shift()

	function addNamePart() {
		var nextPart = nameParts.shift()
		if (nextPart && name.length + nextPart.length < maxLen) {
			name += ' ' + nextPart

			if (nameParts.length)
				addNamePart()
		}
	}

	addNamePart()

	if (name.length > maxLen)
		name = name.substring(0, maxLen)

	return name
}

function prettyPrintGraphInfo(graph) {
	// Get displayed values for graph and owner
	// 'this-is-a-graph' => 'This Is A Graph'
	var graphName = graph.name.split('-')
		.map(s => s.charAt(0).toUpperCase() + s.slice(1))
		.join(' ')

	// Figure out if the graph owner has a fullname
	// Use that if does, else use the username for display
	var graphOwner
	var creator = graph._creator
	if (creator && creator.name && !isStringEmpty(creator.name)) {
		graphOwner = creator.name
		graph.username = creator.username
	} else {
		if (graph.owner)
			graphOwner = graph.owner
		else
			graphOwner = 'anonymous'
		graph.username = graphOwner
	}

	graph.prettyOwner = graphOwner
	graph.prettyName = makeCardName(graphName)

	graph.size = ''

	if (graph.stat && graph.stat.size) {
		var sizeInKb = (graph.stat.size / 1048576).toFixed(2) // megabytes
		graph.size = sizeInKb + ' MB'
	}

	return graph
}

function makeGraphSummary(req,graph) {
	graph = prettyPrintGraphInfo(graph)
	return {
		id:				graph.id,
		graphMinUrl: 	graph.url,
		graphName: 		graph.prettyName,
		previewImage: 	'http://' + req.headers.host + graph.previewUrlLarge,
		playerVersion: 	graph.version,
		stat:			graph.stat,
		hasAudio:		graph.hasAudio,
		views: 			graph.views,
		createdAt:		graph.createdAt,
		updatedAt:		graph.updatedAt,
		createdTS:		graph.createdTS,
		updatedTS:		graph.updatedTS
	}
}

function GraphController(s, gfs, mongoConnection) {
	var args = Array.prototype.slice.apply(arguments);
	args.unshift(Graph);
	AssetController.apply(this, args);

	this.redisClient = redis.createClient({
		host: process.env.REDIS || 'localhost'
	})

	this.serialNumber = new SerialNumber(this.redisClient)

	this.graphAnalyser = new GraphAnalyser(gfs)
	this.previewImageProcessor = new PreviewImageProcessor()
}

GraphController.prototype = Object.create(AssetController.prototype)

GraphController.prototype.publicRankedIndex = function(req, res, next) {
	this._service.publicRankedList()
	.then(function(list) {
		list.map(function(graph) {
			graph = prettyPrintGraphInfo(graph)
			graph.prettyName = makeCardName(graph.prettyName)
		})

		if (req.xhr) {
			return res.json(helper.responseStatusSuccess('OK', list))
		}

		res.render('server/pages/browse', {
			meta : {
				title: 'Vizor - Browse',
				bodyclass: 'bBrowse',
				scripts : [
					helper.metaScript('site/userpages.js')
				]
			},
			graphs: list
		})
	})
	.catch(next)
}

// GET /fthr?public=1|0
GraphController.prototype._userOwnIndex = function(user, req, res, next) {
	var that = this
	var username = user.username
	// the user wants to see only their private graphs
	var wantPrivate = undefined
	if (typeof req.query.public !== 'undefined') {
		wantPrivate = (req.query.public === '0')
	}

	var makeList = function(list) {
		if (!list || !list.length)
			return
		return list.map(function(graph) {
			return prettyPrintGraphInfo(graph.toJSON())
		})
	}

	function render(publicList, privateList, profile, data) {
		data = _.extend({
			bodyclass: '',
			publicHasMoreLink: false,
			privateHasMoreLink: false,
			isSummaryPage: false,
			withProjectListFilter : true,
			meta : {
				header: 'srv/userpage/userpageHeader',
				title: 'Your Files',
				scripts: [
					helper.metaScript('site/userpages.js')
				]
			}
		}, data)

		// format
		data.publicGraphs = publicList || []
		data.privateGraphs = privateList || []
		data.profile = profile

		// :/ _.extend
		data.meta.bodyclass = ('bUserpage ' + (data.bodyclass)).trim()
		delete data.bodyclass

		if (req.xhr) {
			return res.status(200).json(
				helper.responseStatusSuccess('OK', data))
		}

		res.render('server/pages/userpage', data)
	}

	var profile = user.toJSON()

	var maxNOnFront = 8
	var data = {
		publicHasMoreLink : false,
		privateHasMoreLink : false
	}
	// front page, two lists
	if (wantPrivate === undefined) {
		data.isSummaryPage = true
		data.bodyclass = 'bGraphlistSummary'
		var publicList, privateList
		that._service.userGraphs(username, {private:false}, 0, maxNOnFront+1)
			.then(function(list){
				if (list && (list.length >= maxNOnFront)) {
					data.publicHasMoreLink = true
					list.pop()
				}
				publicList = makeList(list)
				return that._service.userGraphs(username, {private:true}, 0, maxNOnFront+1)
			})
			.then(function(list) {
				if (list && (list.length >= maxNOnFront)) {
					data.privateHasMoreLink = true
					list.pop()
				}
				privateList = makeList(list)

				render(publicList, privateList, profile, data)
			})
	} else {
		// "Public" or "Private" lists
		data.isSummaryPage = false
		that._service.userGraphs(username, {private: wantPrivate})
			.then(function(list){
				data.bodyclass = (wantPrivate) ? 'bGraphlistPrivate' : 'bGraphlistPublic'
				list = list.map(function(graph) {
					return prettyPrintGraphInfo(graph.toJSON())
				})

				if (wantPrivate)
					render(null, list, profile, data)
				else
					render(list, null, profile, data)
			})
	}

}

GraphController.prototype._userPublicIndex = function(user, req, res, next) {
	var that = this
	var username = (user) ? user.username : null

	var filter = (req.user && req.user.isAdmin) ? null : {'private':false}

	that._service.userGraphs(username, filter)
		.then(function(list) {

			// no files found, but if there is a user
			// then show empty userpage
			if (!user && (!list || !list.length)) {
				return next()
			}

			list = list
			.map(function(graph) {
				return prettyPrintGraphInfo(graph.toJSON())
			})

			var data = {
				profile: user ? user.toPublicJSON() : {},
				graphs: list || []
			}

			if (req.xhr) {
				return res.status(200).json(
					helper.responseStatusSuccess('OK', data))
			}

			_.extend(data, {
				isSummaryPage: false,
				withProjectListFilter : false,
				meta : {
					header: 'srv/userpage/userpageHeader',
					title: username+'\'s Files',
					bodyclass: 'bUserpage',
					scripts : [
						helper.metaScript('site/userpages.js')
					]
				}
			})

			res.render('server/pages/userpage', data);
		});
}


// GET /fthr
GraphController.prototype.userIndex = function(req, res, next) {
	var username = req.params.model

	var that = this
	User.findOne({ username: username }, function(err, user) {
		if (err)
			return next(err)

		if (visitorIsUser(req, user))
			return that._userOwnIndex(user, req, res, next)
		else
			return that._userPublicIndex(user, req, res, next)
	})
}

// GET /graph
GraphController.prototype.adminIndex = function(req, res) {
	var user = req.user

	this._service.listWithPreviews()
	.then(function(list) {
		if (req.xhr || req.path.slice(-5) === '.json')
			return res.json(list);

		list = list.map(function(graph) {
			return prettyPrintGraphInfo(graph.toJSON())
		})

		var data = {
			graphs: list
		}

		_.extend(data, {
			meta : {
				title: 'Graphs',
				bodyclass: 'bGraphs',
				scripts: [
					helper.metaScript('site/userpages.js')
				]
			}
		});

		res.render('graph/index', data);
	})
}

function renderEditor(res, graph, hasEdits) {
	var releaseMode = process.env.NODE_ENV === 'production'
	var layout = releaseMode ? 'editor-bundled' : 'editor'
	
	res.header('Cache-control', 'no-cache, must-revalidate, max-age=0')

	function respond() {
		res.render('editor', {
			layout: layout,
			graph: graph,
			hasEdits: hasEdits,
			releaseMode: releaseMode,
			webSocketHost: process.env.WSS_HOST || '',
			useSecureWebSocket: releaseMode || !!process.env.WSS_SECURE || false
		})
	}

	if (!releaseMode) {
		templateCache.recompile(function() {
			respond()
		})
	}
	else
		respond()
}

// GET /fthr/dunes-world/edit
GraphController.prototype.edit = function(req, res, next) {
	var that = this

	if (!req.params.path) {
		return this.serialNumber.next('editLog')
		.then(function(serial) {
			return res.redirect('/' + makeHashid(serial))
		})
	}

	this._service.findByPath(req.params.path)
	.then(function(graph) {
		if (graph && (graph.editable === false || graph.private === true)) {
			if (!isGraphOwner(req.user, graph))
				return renderError(404, res)
		}

		EditLog.hasEditsByName(that.redisClient, req.params.path.substring(1))
		.then(function(hasEdits) {
			renderEditor(res, graph, hasEdits)
		})
	})
	.catch(next)
}


// GET /latest-graph
GraphController.prototype.latest = function(req, res) {
	this._service.list()
	.then(function(list) {
		res.redirect(list[0].path)
	});
}

function renderPlayer(graph, req, res, options) {
	graph.increaseViewCount()

	if (graph._creator)
		graph._creator.increaseViewCount()

	var graphJson = prettyPrintGraphInfo(graph.toJSON())

	// which version of player to use?
	var version = graphJson.version || packageJson.version
	version = version.split('.').slice(0,2).join('.')

	var releaseMode = process.env.NODE_ENV === 'production'
	var layout = releaseMode ? 'player-bundled' : 'player'

	res.render('graph/show', {
		layout: res.locals.layout || layout,
		playerVersion: version,
		autoplay: !!(options && options.autoplay),
		noHeader: options.noHeader || false,
		isEmbedded: options.isEmbedded || false,
		graph: graphJson,
		graphMinUrl: graphJson.url,
		graphName: graphJson.prettyName,
		graphOwner: graphJson.prettyOwner,
		previewImage: 'http://' + req.headers.host + graphJson.previewUrlLarge,
		previewImageWidth: 1280,
		previewImageHeight: 720,
		startMode : options.startMode || 1
	})
}

// GET /embed/fthr/dunes-world
GraphController.prototype.embed = function(req, res, next) {
	this._service.findByPath(req.params.path)
	.then(function(graph) {
		if (!graph || graph.deleted)
			return next()

		var autoplay = false
		if (req.query.no_fullscreen === 'true') autoplay = true

		// webvrmanager/boilerplate
		var startMode = parseInt(req.query.start_mode)
		if (isNaN(startMode)) startMode = 1

		return renderPlayer(graph, req, res, {
			isEmbedded: true,
			autoplay: req.query.autoplay || autoplay,
			noHeader: req.query.noheader || false,
			startMode : startMode
		})
	}).catch(next)
}

// GET /fthr/dunes-world
// GET /fthr/dunes-world?summmary=1
GraphController.prototype.graphLanding = function(req, res, next) {
	var wantSummary = req.query.summary || false

	req.params.path = req.params.path.toLowerCase()

	function notFound() {
		res.status(404).json(helper.responseStatusError('not found'))
	}

	this._service.findByPath(req.params.path)
	.then(function(graph) {
		if (!graph || graph.deleted)
			return notFound()

		if (wantSummary) {
			var data = makeGraphSummary(req, graph.toJSON())
			return res.json(helper.responseStatusSuccess('OK', data))
		}
		
		return renderPlayer(graph, req, res, {
			autoplay: true
		})
	}).catch(next)
}

// POST /fthr/dunes-world
GraphController.prototype.graphModify = function(req, res, next) {

	var that = this
	// if want XHR return json
	// else redirect to GET URL

	req.params.path = req.params.path.toLowerCase()
	var wantXhr = req.xhr

	function notFound() {
		res.status(404).json(helper.responseStatusError('not found'))
	}

	this._service.findByPath(req.params.path)
	.then(function(graph) {
		if (!graph || graph.deleted)
			return notFound()

		if (!(req.user && ownsGraph(req.user, graph)))
			return notFound()

		switch (req.body.private) {
			case 'true':
				graph.private = true
				break
			case 'false':
				graph.private = false
				break
		}

		var opts = {
			version: graph.playerVersion,
			updatedAt: graph.updatedAt
		}
		
		that._service.save(graph, req.user, opts)
			.then(function(savedGraph, err){
				if (err) {
					res.status(500).json(helper.responseStatusError('could not save graph', err))
				}

				var data = makeGraphSummary(req, savedGraph.toJSON())
				// add these two to response
				data.private = savedGraph.private
				data.editable = savedGraph.editable
				if (wantXhr)
					return res.json(helper.responseStatusSuccess('OK', data))
				// else
				return res.redirect(req.params.path)
			})



	}).catch(next)
}



// GET /fthr/dunes-world/graph.json
GraphController.prototype.stream = function(req, res, next) {
	var that = this;

	this._service.findByPath(req.params.path)
	.then(function(item) {
		that._fs.createReadStream(item.url)
		.pipe(res)
		.on('error', next)
	})
	.catch(next)
}

GraphController.prototype._makePath = function(req, path) {
	return '/' + req.user.username
		+ '/' + assetHelper.slugify(fsPath.basename(path, fsPath.extname(path)))
}

GraphController.prototype.canWriteUpload = function(req, res, next) {
	var that = this;

	if (!req.files)
		return next(new Error('No files uploaded'));

	var file = req.files.file;
	var dest = this._makePath(req, file.path);

	that._service.canWrite(req.user, dest)
	.then(function(can)
	{
		if (!can)
			return res.status(403)
				.json({message: 'Sorry, permission denied'});

		next();
	});
} 

// POST /graph with file upload
GraphController.prototype.upload = function(req, res, next) {
	var that = this;
	var file = req.files.file;

	if (fsPath.extname(file.path) !== '.json')
		return next(new Error('The upload is not a graph JSON! Are you sure you are trying to upload a graph?'))

	var path = this._makePath(req, file.path);
	var gridFsPath = '/graph'+path+'.json';

	return this._service.canWrite(req.user, path)
	.then(function(can) {
		if (!can) {
			return res.status(403)
				.json({message: 'Sorry, permission denied'});
		}

		// move the uploaded file into GridFS / local FS
		return that._fs.move(file.path, gridFsPath)
		.then(function(url) {
			return that._service.findByPath(path)
			.then(function(model) {
				if (!model)
					model = { path: path };

				model.url = url;

				// save/update the model
				return that._service.save(model, req.user)
				.then(function(asset) {
					res.json(asset);
				});
			});
		})
	})
	.catch(function(err) {
		return next(err);
	});
};

// POST /graph/delete
GraphController.prototype.delete = function(req, res, next) {
	var that = this
	var path = this._makePath(req, req.params.path)

	this._service.canWrite(req.user, path)
	.then(function(can) {
		if (!can) {
			return res.status(403).json({
				message: 'Sorry, permission denied'
			})
		}

		that._service.findByPath(path)
		.then(function(graph) {
			if (!graph || graph.deleted) {
				return res.status(404).json(helper.responseStatusError('not found'))
			}

			graph.deleted = true

			return that._service.save(graph, req.user)
			.then(function(asset) {
				req.user.decreaseProjectsCount()
				res.json(asset)
			})
			.catch(function(err) {
				next(err)
			})
		})
	})
	.catch(next)
}

GraphController.prototype._save = function(path, user, req, res, next) {
	var that = this

	var wantsPrivate = !req.body.isPublic
	var gridFsGraphPath = '/graph'+path+'.json';

	if (user.isAnonymous) {
		wantsPrivate = false
		req.body.editable = true
	}

	var gridFsOriginalImagePath = '/previews'+path+'-preview-original.png'

	var previewImageSpecs = [{
		gridFsPath: '/previews'+path+'-preview-440x330.png',
		width: 440,
		height: 330
	}, {
		gridFsPath: '/previews'+path+'-preview-1280x720.png',
		width: 1280,
		height: 720,
	}]

	var tags = that._parseTags(req.body.tags);

	return that._fs.writeString(gridFsGraphPath, req.body.graph)
	.then(function() {
		if (!req.body.previewImage) {
			return
		}

		// save original image (if we ever need to batch process any of these)
		return that._fs.writeString(gridFsOriginalImagePath, req.body.previewImage.replace(/^data:image\/\w+;base64,/, ""), 'base64')
		.then(function() {
			// create preview images
			return that.previewImageProcessor.process(path, req.body.previewImage, previewImageSpecs)
			.then(function(processedImages) {
				if (processedImages && processedImages.length === 2) {
					// write small image
					return that._fs.writeString(previewImageSpecs[0].gridFsPath, processedImages[0], 'base64')
					.then(function() {
						// write large image
						that._fs.writeString(previewImageSpecs[1].gridFsPath, processedImages[1], 'base64')
					})
				}
			})
		})
	})
	.then(function() {
		return that.graphAnalyser.analyseJson(req.body.graph)
	})
	.then(function(analysis) {
		var url = that._fs.url(gridFsGraphPath);
		var previewUrlSmall = that._fs.url(previewImageSpecs[0].gridFsPath)
		var previewUrlLarge = that._fs.url(previewImageSpecs[1].gridFsPath)

		var model = {
			path: path,
			tags: tags,
			url: url,
			private: wantsPrivate,
			hasAudio: !!analysis.hasAudio,
			editable: req.body.editable === false ? false : true,
			stat: {
				size: analysis.size,
				numAssets: analysis.numAssets
			},
			previewUrlSmall: previewUrlSmall,
			previewUrlLarge: previewUrlLarge
		}

		return that._service.save(model, user)
		.then(function(asset) {
			res.json(asset)
		})
		.catch(function(err) {
			next(err)
		})
	})

}

// POST /graph
GraphController.prototype.save = function(req, res, next) {
	var that = this;
	var path = this._makePath(req, req.body.path);

	this._service.canWrite(req.user, path)
	.then(function(can) {
		if (!can) {
			return res.status(403)
				.json({ message: 'Sorry, permission denied' })
		}

		return that._save(path, req.user, req, res, next)
	})
	.catch(next)
}

// POST /graph
GraphController.prototype.saveAnonymous = function(req, res, next) {
	var that = this
	var anonReq = { user: { username: 'v', isAnonymous: true } }

	if (!req.body)
		return renderError(400, res)

	return this.graphAnalyser.analyseJson(req.body.graph)
	.then(function(analysis) {
		if (!analysis.numNodes) {
			return res.status(400)
				.json({ message: 'Invalid data' })
		}

		return that.serialNumber.next('anonymousGraph')
		.then(function(serial) {
			var uid = makeHashid(serial)
			var path = that._makePath(anonReq, uid)

			req.body.path = path

			return that._save(path, anonReq.user, req, res, next)
		})
	})
	.catch(next)
}

module.exports = GraphController;
