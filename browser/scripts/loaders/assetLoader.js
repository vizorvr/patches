(function() {

if (typeof(module) !== 'undefined') {
	EventEmitter = require('events').EventEmitter
	when = require('when')
}

var loadingPlugins = {
	'three_loader_model': 'model',
	'three_loader_scene': 'scene',
	'url_texture_generator': 'texture',
	// 'url_audio_buffer_generator': 'audiobuffer',
	// 'url_audio_generator': 'audio',
	// 'url_json_generator': 'json',
	// 'url_video_generator': 'video'
}

// ------------------------------------------------

function AssetLoader(loaders) {
	EventEmitter.call(this)

	this.loadingTexture = THREE.ImageUtils.loadTexture('/data/textures/loadingtex.png')
	this.loadingTexture.wrapS = THREE.RepeatWrapping
	this.loadingTexture.wrapT = THREE.RepeatWrapping

	this.defaultTexture = THREE.ImageUtils.loadTexture('/data/textures/defaulttex.png')
	this.defaultTexture.wrapS = THREE.RepeatWrapping
	this.defaultTexture.wrapT = THREE.RepeatWrapping

	var defaultLoaders = {
		image: E2.Loaders.ImageLoader,
		texture: E2.Loaders.TextureLoader,
		model: E2.Loaders.ModelLoader,
		scene: E2.Loaders.SceneLoader
	}

	this.loaders = loaders || defaultLoaders

	this.assetPromises = {}

	this.assetsLoaded = 0
	this.assetsFound = 0

}

AssetLoader.prototype = Object.create(EventEmitter.prototype)

/**
 * load a single asset of type from url, affecting total percentage
 */
AssetLoader.prototype.loadAsset = function(assetType, assetUrl) {
	var that = this
	var dfd = when.defer()

	if (this.assetPromises[assetUrl]) {
		var cache = this.assetPromises[assetUrl]

		if (cache.progress < 1) {
			return cache.promise
		}

		dfd.resolve(this.assetPromises[assetUrl].asset)
	} else {
		this.assetsFound++

		this.assetPromises[assetUrl] = {
			promise: dfd.promise,
			progress: 0
		}

		var loader = new (this.loaders[assetType])(assetUrl)
		loader
		.on('progress', function(assetPct) {
			var pct = 0

			that.assetPromises[assetUrl].progress = assetPct

			Object.keys(that.assetPromises)
			.map(function(assetUrl) {
				pct += that.assetPromises[assetUrl].progress
			})

			pct = pct / that.assetsFound
			that.emit('progress', pct * 100)
		})
		.on('error', function(err) {
			that.assetsLoaded++;
			that.totalProgress++;
			delete that.assetPromises[assetUrl]

			msg('ERROR: AssetLoader failed to load ' + assetUrl +': ' + err.toString())

			dfd.reject(err)
		})
		.on('loaded', function(asset) {
			that.assetsLoaded++
			that.totalProgress++
			that.assetPromises[assetUrl].asset = asset
			that.assetPromises[assetUrl].progress = 1
			dfd.resolve(asset)
		})
	}

	return dfd.promise
}

/**
 * load all assets for a graph
 */
AssetLoader.prototype.loadAssetsForGraph = function(graph) {
	var that = this

	var dfd = when.defer()

	var assets = this.parse(graph)

	this.totalProgress = 0

	var assetTypes = Object.keys(assets)

	assetTypes.map(function(assetType) {
		var typeAssets = assets[assetType]

		typeAssets.map(function(assetUrl) {
			if (!assetUrl)
				return;

			console.log('Loading', assetType, assetUrl)

			that.loadAsset(assetType, assetUrl)
			.then(function() {
				if (that.assetsLoaded === that.assetsFound) {
					that.emit('progress', 100)
					dfd.resolve()
				}
			})
			.catch(function(err) {
				dfd.reject(err)
			})
		})
	})

	return dfd.promise
}

AssetLoader.prototype.parse = function(graph) {
	var assets = {}

	function findInGraph(subgraph) {
		if (!subgraph.nodes)
			return

		subgraph.nodes.map(function(node) {
			if (node.plugin === 'graph')
				return findInGraph(node.graph)

			var assetType = loadingPlugins[node.plugin]

			if (!assetType)
				return;

			if (!assets[assetType])
				assets[assetType] = []

			assets[assetType].push(node.state.url)
		})
	}

	findInGraph(graph)

	return assets
}

if (typeof(module) !== 'undefined') {
	module.exports.AssetLoader = AssetLoader
} else {
	window.AssetLoader = AssetLoader
}

})()
