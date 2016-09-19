/**
 * GET /threesixty
 * Threesixty site
 */

const FRONT_PATH = 'kschzt/featured'
var FRONT_URL = '/data/graph/'+FRONT_PATH+'.json'

exports.index = function(req, res) {
	var releaseMode = process.env.NODE_ENV === 'production'
	var layout = releaseMode ? 'threesixty-bundled' : 'threesixty'

	// get show frontpage graph URL
	res.render('graph/show', {
		layout: layout,
		site: 'threesixty',
		graphSrc: '/featured',
		graphMinUrl: '/featured',
		autoplay: true,
		hideEditButton: false,
		hideShareButton: false,
		hidePlayButton: true,
		meta : {
			bodyclass : 'bThreesixty b360'
		},
		noHeader: false,
		graph: {
			hasAudio: false
		},
		startMode : 1
	});
}

exports.featured = function(req,res) {
	res.redirect(FRONT_URL)
}