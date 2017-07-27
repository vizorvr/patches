const when = require('when')
const Graph = require('../models/graph')
const fsPath = require('path')
const config = require('../config/config')

let CDN_ROOT = '/data'
if (config.server.useCDN)
	CDN_ROOT = config.server.cdnRoot

const STAFFPICKS_TTL = 30 * 60 * 1000

let cache, cacheTime = 0
const getCache = () => {
	if (process.env.NODE_ENV !== 'production')
		return

	if (Date.now() - cacheTime > STAFFPICKS_TTL) {
		cache = undefined
		return
	}

	return cache
}

const setCache = data => {
	cacheTime = Date.now()
	cache = data
	return cache
}

function cdnUrl(url) {
	if (!url)
		return url
	return CDN_ROOT + url.replace(/^\/data/, '')
}

function fixGraphUrls(graphModel) {
	var graph = graphModel.getPrettyInfo()
	graph.previewUrlSmall =	cdnUrl(graph.previewUrlSmall)
	return graph
}

function getHomeStaffPicks() {
	var staffPicks = {}
	var dfd = when.defer()

	let cached = getCache()
	if (cached)
		return when.resolve(cached)

	// get front page staff picks, sort them by rank/createdAt
	Graph.find({
		staffpicks: 'frontpage'
	})
	.sort({
		rank: -1,
		createdAt: -1
	})
	.exec((err, graphs) => {
		if (err) {
			console.error(err.stack)
			return dfd.resolve([])
		}

		var patchesPicks = []
		// collect staff picked graphs into their categories
		graphs.map(graph => {
			graph.staffpicks.map(tag => {
				if (!staffPicks[tag])
					staffPicks[tag] = []

				var prettyInfo = fixGraphUrls(graph)
				staffPicks[tag].push(prettyInfo)
				patchesPicks.push(prettyInfo)
			})
		})

		// patches homepage
		staffPicks['_patches'] = pickFromStaffPicks(patchesPicks, 8)

		dfd.resolve(setCache(staffPicks))
	})

	return dfd.promise
}

function pickFromStaffPicks(array, maxLength) {
	maxLength = maxLength || 3
	array.sort(function() { return 0.5 - Math.random() }) // shuffle
	return array.slice(0, maxLength)
}

/**
 * GET /
 * Home page.
 */
exports.index = function(req, res)  {
	getHomeStaffPicks()
	.then(function(graphs) {
		let picks = {}

		Object.keys(graphs).map(tag => {
			picks[tag] = pickFromStaffPicks(graphs[tag].slice())
		})

		res.render('home', {
			featured: picks,
			cdnRoot: CDN_ROOT,
			meta: {
				bodyclass: 'bHome bIndex',
				header: false
			}
		})
	})
}


/**
 * GET /about
 * Home > about
 */
exports.about = function(req, res)  {
	return res.redirect('../')
}