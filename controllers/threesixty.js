/**
 * GET /threesixty
 * Threesixty site
 */
exports.index = function(req, res) {
	// get show frontpage graph URL
	res.render('graph/show', {
		layout: 'threesixty',
		graphSrc: '/data/graph/eesn/flamingofront.json',
		graphMinUrl: '/data/graph/eesn/flamingofront.json',
		autoplay: true,
		hideEditButton: true,
		hideShareButton: true,
		hidePlayButton: true,
		meta : {
			bodyclass : 'bThreesixty b360'
		}
	});
}

