(function() {
	function progress() {
		console.log('Loading progress', this.state.url, arguments)
	}

	function errorHandler(err) {
		msg('ERROR: '+err.toString())
	}

	var ThreeLoaderModelPlugin = E2.plugins.three_loader_model = function(core) {
		AbstractThreeLoaderObjPlugin.apply(this, arguments)
	}

	ThreeLoaderModelPlugin.prototype = Object.create(AbstractThreeLoaderObjPlugin.prototype)

	ThreeLoaderModelPlugin.prototype.getDefaultMaterials = function() {
		return [new THREE.MeshBasicMaterial()]
	}

	ThreeLoaderModelPlugin.prototype.getDefaultGeometries = function() {
		return [new THREE.Geometry()]
	}

	ThreeLoaderModelPlugin.prototype.create_ui = function() {
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
					mixpanel.track('ThreeLoaderModelPlugin Model Changed')
				})
				.on('closed', function() {
					if (newValue === oldValue)
						return

					that.undoableSetState('url', newValue, oldValue)
				})
		})

		return inp
	}

	ThreeLoaderModelPlugin.prototype.loadObj = function() {
		THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader())

		console.log('ThreeLoaderModelPlugin loading OBJ', this.state.url)

		var mtlUrl = this.state.url.replace('.obj', '.mtl')

		var that = this

		$.get('/stat' + mtlUrl, function(data) {
			if (data.error === undefined) {
				// .mtl exists on server, load .obj and .mtl
				new THREE.OBJMTLLoader()
					.load(that.state.url, mtlUrl, that.onObjLoaded.bind(that), progress.bind(that), errorHandler)
			}
			else {
				// no .mtl on server, load .obj only
				new THREE.OBJLoader()
					.load(that.state.url, that.onObjLoaded.bind(that), progress.bind(that), errorHandler)
			}
		})
	}

	ThreeLoaderModelPlugin.prototype.onJsonLoaded = function(geoms, mats) {
		this.onObjLoaded([geoms], mats)
	}

	ThreeLoaderModelPlugin.prototype.loadJson = function() {
		console.log('ThreeLoaderModelPlugin loading JSON', this.state.url)

		new THREE.JSONLoader()
			.load(this.state.url,
				this.onJsonLoaded.bind(this),
				progress.bind(this),
				errorHandler
			)
	}

	ThreeLoaderModelPlugin.prototype.update_state = function() {
		if (!this.dirty)
			return

		if (!this.state.url)
			return;

		this.geometries = this.getDefaultGeometries()

		this.materials = this.getDefaultMaterials()

		THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader())

		console.log('AbstractThreeLoaderObjPlugin loading', this.state.url)

		var url = this.state.url
		var extname = url.substring(url.lastIndexOf('.'))
		console.log('loading', extname)
		switch(extname) {
			case '.obj':
				this.loadObj()
				break;
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

	ThreeLoaderModelPlugin.prototype.update_output = function(slot) {
		if (slot.index === 0) {
			return this.geometries
		}
		if (slot.index === 1) {
			return this.materials
		}
	}

})()

