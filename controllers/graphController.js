var _ = require('lodash')
var Graph = require('../models/graph')
var AssetController = require('./assetController')
var fsPath = require('path')
var assetHelper = require('../models/asset-helper')

var templateCache = require('../lib/templateCache').templateCache

var helper = require('./controllerHelpers')
var isStringEmpty = require('../lib/stringUtil').isStringEmpty
var PreviewImageProcessor = require('../lib/previewImageProcessor')

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

function prettyPrintList(list) {
	if (!list || !list.length)
		return list
	return list.map(function(graph) {
		return graph.getPrettyInfo()
	})
}

function makeGraphSummary(req, graphModel) {
	var graph = graphModel.getPrettyInfo()
	return {
		id:				graph.id,
		graphMinUrl: 	graph.url,
		graphName: 		graph.prettyName,
		previewImage: 	'http://' + req.headers.host + graph.previewUrlLarge,
		playerVersion: 	graph.version,
		stat:			graph.stat,
		hasAudio:		graph.hasAudio,
		hasVideo:		graph.hasVideo,
		views: 			graph.views,
		createdAt:		graph.createdAt,
		updatedAt:		graph.updatedAt,
		createdTS:		graph.createdTS,
		updatedTS:		graph.updatedTS,
		private: 		graph.private,
		editable: 		graph.editable
	}
}

function parsePaging(req, perPage) {
	var page = 0
	var start = 0
	if (req.params && typeof req.params.page !== 'undefined') {
		page = req.params.page
	}
	else if (req.query) {
		page = req.query.page
		start = req.query.start
	}

	page = parseInt(page, 10) || 1
	start = parseInt(start, 10) || 0
	var pageSize = parseInt(process.env.GRAPHCONTROLLER_PAGE_SIZE, 10) || (perPage || 20)

	if (page < 1)
		page = 1

	var offset
	if (start) {
		offset = start
		page = 1 + Math.floor(offset / pageSize)
	}
	else if (page) {
		// page
		offset = pageSize * (page - 1)
	}

	if (offset < 0)
		offset = 0

	return {
		page: page,
		offset: offset,
		limit: pageSize
	}
}

// ----------------------------

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


// GET /browse
GraphController.prototype.publicRankedIndex = function(req, res, next) {
	var paging = parsePaging(req)
	this._service.publicRankedList(paging)
	.then((data) => {

		data.list = prettyPrintList(data.list)
		var listmeta = data.meta
		if (listmeta)
			listmeta.baseUrl = '/browse/'

		if (req.xhr) {
			return res.json(helper.responseStatusSuccess('OK', data))
		}

		res.render('graph/index', {meta : {
				title : 'Vizor - Browse projects',
				footer: 'srv/home/_footer',
				bodyclass: 'bBrowse',
				scripts: [
					helper.metaScript('site/userpages.js'),
					helper.metaScript('ui/pagination.js')
				]},
				pageHeading: 'Public projects',
				graphs: data})
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

	function render(publicGraphs, privateGraphs, profile, data) {
		data = _.extend({
			bodyclass: '',
			publicHasMoreLink: false,
			privateHasMoreLink: false,
			isSummaryPage: false,
			withProjectListFilter : true,
			meta : {
				header: 'srv/userpage/userpageHeader',
				footer: 'srv/home/_footer',
				title: 'Your Files',
				scripts: [
					helper.metaScript('site/userpages.js')
				]
			}
		}, data)

		// format
		data.publicGraphs = publicGraphs
		data.privateGraphs = privateGraphs
		data.profile = profile

		if (publicGraphs)
			data.publicHasMoreLink = publicGraphs.meta.totalCount > publicGraphs.meta.listCount

		if (privateGraphs)
			data.privateHasMoreLink = privateGraphs.meta.totalCount > privateGraphs.meta.listCount

		// allow the 'create' card to appear if both lists are empty. see css.
		var totalProjects = 0
		for (var graphs of [data.publicGraphs, data.privateGraphs]) {
			if (graphs) {
				if (Array.isArray(graphs))
					totalProjects += graphs.length				// plain list
				else if (Array.isArray(graphs.list))
					totalProjects += graphs.list.length			// {list:, meta:} (pagination)
			}
		}

		var noProjectsClass = (totalProjects > 0) ? '' : 'noProjects '
		data.meta.bodyclass = ('bUserpage ' + noProjectsClass + data.bodyclass).trim()
		delete data.bodyclass


		if (req.xhr) {
			return res.status(200).json(
				helper.responseStatusSuccess('OK', data))
		}
		res.render('server/pages/userpage', data)
	}

	var profile = user.toJSON()

	var maxNumOnFront = 7	// allow for "create new" card
	// front page, two lists
	var data = {}
	if (wantPrivate === undefined) {
		data.isSummaryPage = true
		data.bodyclass = 'bGraphlistSummary'
		var publicResults
		that._service.userGraphsWithPrivacy(username, 0, maxNumOnFront, false)
			.then((results)=>{
				if (results.list) {
					results.list = prettyPrintList(results.list)
					publicResults = results
				}
				return that._service.userGraphsWithPrivacy(username, 0, maxNumOnFront, true)
			})
			.then((privateResults) => {
				if (privateResults.list) {
					privateResults.list = prettyPrintList(privateResults.list)
				}
				return render(publicResults, privateResults, profile, data)
			})
			.catch((err)=>{
				console.error(err)
				render(null, null, profile, data)
			})
	} else {
		// "Public" or "Private" lists
		var paging = parsePaging(req)
		data.isSummaryPage = false
		that._service.userGraphsWithPrivacy(username, paging.offset, paging.limit, wantPrivate)
			.then(function(result){

				data.bodyclass = (wantPrivate) ? 'bGraphlistPrivate' : 'bGraphlistPublic'

				result.list = prettyPrintList(result.list)

				if (wantPrivate)
					render(null, result, profile, data)
				else
					render(result, null, profile, data)
			})
			.catch((err) => {
				console.error(err)
				render(null,null,profile,data)
			})
	}

}

// GET /fthr when visitor is not fthr
GraphController.prototype._userPublicIndex = function(user, req, res, next) {
	var that = this
	var username = (user) ? user.username : null
	var graphs

	var paging = parsePaging(req)

	if (req.user && req.user.isAdmin)
		graphs = that._service.userGraphs(username, paging.offset, paging.limit)
	else
		graphs = that._service.userGraphsWithPrivacy(username, paging.offset, paging.limit, false)	// public

	graphs
		.then((result) => {
			// no files found, but if there is a user
			// then show empty userpage
			if (!result)
				return next()

			var list = result.list
			if (!user && (!list || !list.length)) {
				return next()
			}

			result.list = prettyPrintList(result.list)

			var data = {
				profile: user ? user.toPublicJSON() : {},
				graphs: result
			}

			if (req.xhr) {
				return res.status(200).json(
					helper.responseStatusSuccess("OK", data))
			}

			_.extend(data, {
				isSummaryPage: false,
				withProjectListFilter : false,
				meta : {
					header: 'srv/userpage/userpageHeader',
					footer: 'srv/home/_footer',
					title: username+'\'s Files',
					bodyclass: 'bUserpage bUserpublic',
					scripts : [
						helper.metaScript('site/userpages.js'),
						helper.metaScript('ui/pagination.js')
					]
				}
			})

			res.render('server/pages/userpage', data)
		})
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

	var paging = parsePaging(req)
	this._service.listWithPreviews(paging)
	.then((result) => {
		if (req.xhr || req.path.slice(-5) === '.json')
			return res.json(result.list);

		result.list = prettyPrintList(result.list)

		var data = {
			graphs: result
		}

		_.extend(data, {
			meta : {
				title: 'Graphs',
				bodyclass: 'bGraphs',
				scripts: [
					helper.metaScript('site/userpages.js')
				]
			},
			pageHeading: 'Admin index'
		})

		res.render('graph/index', data)
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


// GET /~latest-graph
GraphController.prototype.latest = function(req, res) {
	this._service.publicList()
	.then(function(list) {
		res.redirect(list[0].path)
	})
}

function renderPlayer(graph, req, res, options) {
	graph.increaseViewCount()

	if (graph._creator)
		graph._creator.increaseViewCount()

	var graphJson = graph.getPrettyInfo()

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
			var data = makeGraphSummary(req, graph)
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
			version: graph.version,
			updatedAt: graph.updatedAt
		}
		
		that._service.save(graph, req.user, opts)
			.then(function(savedGraph, err){
				if (err) {
					res.status(500).json(helper.responseStatusError('could not save graph', err))
				}

				var data = makeGraphSummary(req, savedGraph)
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
	.then(function(can) {
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
						return that._fs.writeString(previewImageSpecs[1].gridFsPath, processedImages[1], 'base64')
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
			hasVideo: !!analysis.hasVideo,
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
