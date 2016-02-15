function PluginDocsCache() {
	this.cache = {}
}

function PluginDocsLoader(plugin) {
	var url = '/docs/plugins/' + plugin

	var xhr = new XMLHttpRequest()
	xhr.open('GET', url, true)
	xhr.crossOrigin = 'Anonymous'
	xhr.responseType = 'text'

	var that = this

	xhr.onerror = function() {
		that.errorHandler(new Error(this.status))
	}

	xhr.onload = function() {
		if (this.status >= 400)
			return this.onerror()

		that.emit('loaded', JSON.parse(this.responseText))
	}

	xhr.send()
}

PluginDocsLoader.prototype = Object.create(E2.Loader.prototype)

PluginDocsCache.prototype.loadDocs = function(plugin) {
	var dfd = when.defer()

	if (this.cache[plugin]) {
		dfd.resolve(this.cache[plugin])
	}
	else {
		var loader = new PluginDocsLoader(plugin)

		var that = this

		loader
		.on('loaded', function(data) {
			that.cache[plugin] = data

			dfd.resolve(data)
		})
		.on('error', function(err) {
			msg('Plugin docs loading failed for', plugin, err)
			dfd.reject(err)
		})

	}

	return dfd.promise
}

if (typeof(module) !== 'undefined')
	module.exports = PluginDocsCache
