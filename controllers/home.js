/**
 * GET /
 * Home page.
 */
exports.index = function(req, res)
{
	res.render('home', {
		layout: 'main',
		meta : {
			bodyclass : 'bHome',
			noheader: true
		}
	});
}

