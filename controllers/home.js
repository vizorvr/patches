/**
 * GET /
 * Home page.
 */
exports.index = function(req, res)
{
	res.render('home', {
		layout: 'main',
		meta : {
			title: 'Vizor',
			bodyclass : 'bHome',
			noheader: true
		}
	});
}

