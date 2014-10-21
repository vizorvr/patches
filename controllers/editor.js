/**
 * GET /editor
 * Editor page.
 */
exports.index = function(req, res)
{
	res.render('editor', {
		layout: 'spa'
	});
}
