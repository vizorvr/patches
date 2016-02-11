(function() {

var statCache = {}

function GridFsClient() {}

GridFsClient.prototype.stat = function(path) {
	var dfd = when.defer()

	if (statCache[path]) {
		dfd.resolve(statCache[path])
	}
	else {
		$.get('/stat' + path, function(data) {
			if (!data.error) {
				statCache[path] = data
				return dfd.resolve(data)
			}

			dfd.resolve()
		})
	}

	return dfd.promise
}

E2.GridFsClient = GridFsClient

})()
