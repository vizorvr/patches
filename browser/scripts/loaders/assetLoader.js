(function() {

if (typeof(module) !== 'undefined') {
	EventEmitter = require('events').EventEmitter
	when = require('when')
}

var loadingPlugins = {
	'three_loader_model': 'model',
	'three_loader_scene': 'scene',
	// 'url_audio_buffer_generator': 'audiobuffer',
	// 'url_audio_generator': 'audio',
	// 'url_json_generator': 'json',
	'url_texture_generator': 'texture',
	// 'url_video_generator': 'video'
}

// ------------------------------------------------

function AssetLoader(loaders) {
	EventEmitter.call(this)

	this.loadingTexture = THREE.ImageUtils.loadTexture('/data/textures/loadingtex.png')
	this.defaultTexture = THREE.ImageUtils.loadTexture('/data/textures/defaulttex.png')

	var defaultLoaders = {
		image: ImageLoader,
		texture: TextureLoader,
		model: ModelLoader,
		scene: SceneLoader
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
			console.log('loadAsset PROMISE found', assetType, assetUrl)
			return cache.promise
		}

		console.log('loadAsset CACHE HIT', assetType, assetUrl)
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

		console.log('Loading type:', assetType)

		typeAssets.map(function(assetUrl) {
			if (!assetUrl)
				return;

			console.log(' - loading asset', assetUrl)

			that.loadAsset(assetType, assetUrl)
			.then(function() {
				if (that.assetsLoaded === that.assetsFound) {
					that.emit('progress', 100)
					dfd.resolve()
				}
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

E2.AssetLoader = AssetLoader

if (typeof(module) !== 'undefined') {
	module.exports.AssetLoader = AssetLoader
	module.exports.modelLoader = modelLoader
}

})()
