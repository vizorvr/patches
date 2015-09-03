/**
 * GET /
 * Home page.
 */
exports.index = function(req, res)
{
	res.render('home', {
		layout: 'home',
		title: 'Vizor'
	});
}

