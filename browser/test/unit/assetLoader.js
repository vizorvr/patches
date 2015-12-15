
global.E2 = {}

var assert = require('assert')
var fs = require('fs')
var graph = JSON.parse(fs.readFileSync(__dirname+'/../fixtures/preloader1.json'))

var AssetLoader = require('../../scripts/loaders/assetLoader.js').AssetLoader
var ModelLoader = require('../../scripts/loaders/loaders').ModelLoader
var ImageLoader = require('../../scripts/loaders/loaders').ImageLoader

describe('Asset loading', function() {
	beforeEach(function() {
		global.msg = console.error.bind(console)
		global.$ = {
			get: function(url, cb) {
				cb({})
			}
		}
		global.THREE = {
			DDSLoader: function() {},
			ImageUtils: {
				loadTexture: function() {}
			},
			Loader: {
				Handlers: { add: function() {} }
			},
		}
	})

	describe('ModelLoader', function() {
		beforeEach(function() {
			global.THREE.JSONLoader = function() {
				return {
					load: function(url, loadedCb, progressFn) {
						process.nextTick(function() {
							progressFn({ loaded: 3, total: 6 })
							loadedCb()
						})
					}
				}
			}
		})

		it('reports progress', function(done) {
			var loader = new ModelLoader('foo.json')
			loader
			.on('progress', function(pct) {
				console.log('foo.json progress')
				assert.equal(0.5, pct)
				done()
			})
		})
	})

	describe('AssetLoader', function() {
		var pre

		function dummyLoader() {
			return function() {
				var ee = new EventEmitter()
				process.nextTick(function() {
					ee.emit('progress', 0.5)

					process.nextTick(function() {
						ee.emit('loaded', {})
					})
				})
				return ee
			}
		}

		beforeEach(function() {
			var loaders = {
				model: dummyLoader(),
				image: dummyLoader(),
				texture: dummyLoader(),
			}

			pre = new AssetLoader(loaders)
		})

		it('parses assets to load correctly', function(done) {
			var assets = pre.parse(graph.root)
			assert.equal(assets.model.length, 1)
			assert.equal(assets.texture.length, 2)
			done()
		})
		
		it('loads assets for graph', function(done) {
			pre.loadAssetsForGraph(graph.root)
			.then(function() {
				assert.equal(3, pre.assetsLoaded)
				done()
			})
		})

		it('reuses asset loading promise', function() {
			var p1 = pre.loadAsset('texture', 'foo')
			var p2 = pre.loadAsset('texture', 'foo')
			assert.equal(p1, p2)
		})

		it('fulfills both asset loading promises', function(done) {
			var p1 = pre.loadAsset('texture', 'foo')
			var p2 = pre.loadAsset('texture', 'foo')
			var counter = 0

			function incr() {
				counter++
				if (counter > 1)
					done()
			}

			p1.then(incr)
			p2.then(incr)
		})

		it('emits progress', function(done) {
			pre.once('progress', function() {
				done()
			})
			pre.loadAssetsForGraph(graph.root)
		})	
	})
})

