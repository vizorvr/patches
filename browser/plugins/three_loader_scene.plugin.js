(function() {
	function progress() {
		console.log('Loading progress', this.state.url, arguments)
	}

	function errorHandler(err) {
		console.log('ERROR: '+err.toString())
	}


	var ThreeLoaderScenePlugin = E2.plugins.three_loader_scene = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js Scene loader'

		this.dirty = true

		this.state.url = ''

		this.input_slots = [].concat(this.input_slots)
	}

	ThreeLoaderScenePlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeLoaderScenePlugin.prototype.create_ui = function() {
		var inp = makeButton('Change', 'No model selected.', 'url')
		var that = this

		inp.click(function() {
			var oldValue = that.state.url
			var newValue

			FileSelectControl
			.createSceneSelector(that.state.url)
			.onChange(function(v) {
				newValue = that.state.url = v
				that.state_changed(null)
				that.state_changed(inp)
				that.updated = true
			})
			.on('closed', function() {
				if (newValue === oldValue)
					return

				that.undoableSetState('url', newValue, oldValue)
			})
		})

		return inp
	}

	ThreeLoaderScenePlugin.prototype.onJsonLoaded = function(scene) {
		console.log('json loaded', this.state.url)
		this.object3d = scene
	}

	ThreeLoaderScenePlugin.prototype.loadJson = function() {
		var loader = new THREE.SceneLoader()

		loader.load(
				this.state.url,
				this.onJsonLoaded.bind(this),
				progress.bind(this),
				errorHandler)
	}

	ThreeLoaderScenePlugin.prototype.update_state = function() {
		if (!this.dirty)
			return

		if (!this.state.url)
			return;

		if (this.object3d) {
			this.object3d = new THREE.Object3D()
		}

		THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader())

		console.log('SceneLoader loading', this.state.url)

		var url = this.state.url
		var extname = url.substring(url.lastIndexOf('.'))
		console.log('loading', extname)
		switch(extname) {
		case '.js':
		case '.json':
			this.loadJson()
			break;
		default:
			msg('ERROR: Don`t know how to load', extname)
			break;
		}

		this.dirty = false
	}

	ThreeLoaderScenePlugin.prototype.update_output = function(slot) {
		if (slot.index === 0) {
			return this.object3d
		}
	}

})()

