const when = require('when')
const Graph = require('../models/graph')
const fsPath = require('path')

function getHomeStaffPicks() {
	var staffPicks = {}
	var dfd = when.defer()

	function cull(array) {
		array.sort(function() { return 0.5 - Math.random() }) // shuffle
		return array.slice(0, 3)
	}

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

		// collect staff picked graphs into their categories
		graphs.map(graph => {
			graph.staffpicks.map(tag => {
				if (!staffPicks[tag])
					staffPicks[tag] = []

				staffPicks[tag].push(graph.getPrettyInfo())
			})
		})

		// cull lists to length of 3
		Object.keys(staffPicks).map(tag => {
			staffPicks[tag] = cull(staffPicks[tag])
		})

		dfd.resolve(staffPicks)
	})

	return dfd.promise
}

/**
 * GET /
 * Home page.
 */
exports.index = function(req, res)  {
	getHomeStaffPicks()
	.then(function(graphs) {
		res.render('home', {
			featured: graphs,
			meta : {
				bodyclass : 'bHome bIndex',
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
	res.render('server/pages/about', {
		layout: 'main',
		meta : {
			bodyclass : 'bHome bAbout',
			title: "About Vizor - Explore, Create and Publish VR on the Web",
			header: false
		}
	})
}