var fsPath = require('path')

function streamFile(req, res, next, gfs) {
	var path = req.path.replace(/^\/data/, '')
	var extname = fsPath.extname(path)
	var model = path.split('/')[1]
	var cacheControl
	var expires = ''

	switch(model) {
		case 'dist':
		case 'graph':
			// minimal caching, please
			cacheControl = 'public, must-revalidate'
			break;
		default:
			// strong caching
 			cacheControl = 'public'
 			expires = 'Sun, 17-Jan-2038 19:14:07 GMT'
 			break;
	}

	return gfs.stat(path)
	.then(function(stat) {
		if (!stat)
			return res.status(404).send();

		if (req.header('If-None-Match') === stat.md5)
			return res.status(304).send();

		res.header('Content-Type', stat.contentType)
		res.header('Cache-Control', cacheControl)
	
		if (expires)
			res.header('Expires', expires)

		if (req.headers.range) {
			// stream partial file range
			var parts = req.headers.range.replace(/bytes[=:]/, "").split("-");
			var partialstart = parts[0];
			var partialend = parts[1];

			// start&end offset are inclusive, end is optional
			var start = parseInt(partialstart, 10);
			var end = partialend ? parseInt(partialend, 10) : (stat.length - 1);

			var chunksize = (end - start) + 1;

			res.header('Content-Range', 'bytes ' + start + '-' + end + '/' + stat.length);
			res.header('Content-Length', chunksize)
			res.header('Accept-Ranges', 'bytes')

			res.status(206);

			var range = {startPos: start, endPos: end};
			gfs.createReadStream(path, range)
			.on('error', next)
			.pipe(res);
		} else {
			// stream whole file in a single request

			// only accept range-requests on audio and video
			var rangeableTypes = ['.mp3', '.m4a', '.ogg', '.mp4', '.ogm', '.ogv']
			if (rangeableTypes.indexOf(extname) !== -1)
					res.header('Accept-Ranges', 'bytes')

			res.header('ETag', stat.md5);
			res.header('Content-Length', stat.length)

			gfs.createReadStream(path)
			.on('error', next)
			.pipe(res)

		}
	})
}

module.exports = streamFile
