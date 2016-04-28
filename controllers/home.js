/**
 * GET /
 * Home page.
 */
exports.index = function(req, res)  {
	res.render('home', {
		layout: 'main',
		meta : {
			bodyclass : 'bHome bIndex',
			noheader: true
		}
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
			title: "About Vizor - Create and Share VR on the Web",
			noheader: true
		}
	})
}