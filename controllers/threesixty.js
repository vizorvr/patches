/**
 * GET /threesixty
 * Threesixty site
 */
exports.index = function(req, res) {
	var releaseMode = process.env.NODE_ENV === 'production'
	var layout = releaseMode ? 'threesixty-bundled' : 'threesixty'

	// get show frontpage graph URL
	res.render('graph/show', {
		layout: layout,
		site: 'threesixty',
		graphSrc: '/threesixty/featured',
		graphMinUrl: '/threesixty/featured',
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
	var featuredGraph = '/data/graph/eesn/flamingofront.json'
	switch (process.env.FQDN) {
		case '360.vizor.io':
		case 'rc.vizor.io':
		case 'vizor.io':
		case '360vr.io':
			featuredGraph = '/data/graph/vizor/threesixty.json'
			break;
	}
	res.redirect(featuredGraph)
}