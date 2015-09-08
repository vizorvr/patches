(function() {
	function progress() {
		console.log('Loading progress', this.state.url, arguments)
	}

	function errorHandler(err) {
		msg('ERROR: '+err.toString())
		this.isLoading = false
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
				})
				.on('closed', function() {
					if (newValue === oldValue)
						return

					that.undoableSetState('url', newValue, oldValue)
				})
		})

		return inp
	}

	ThreeLoaderModelPlugin.prototype.loadObj = function(loadMaterial) {
		THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader())

		console.log('ThreeLoaderModelPlugin loading OBJ', this.state.url)

		var mtlUrl = this.state.url.replace('.obj', '.mtl')

		this.isLoading = true
		if (loadMaterial)
			new THREE.OBJMTLLoader()
				.load(this.state.url, mtlUrl, this.onObjLoaded.bind(this), progress.bind(this), errorHandler)
		else
			new THREE.OBJLoader()
				.load(this.state.url, this.onObjLoaded.bind(this), progress.bind(this), errorHandler)
	}

	ThreeLoaderModelPlugin.prototype.onJsonLoaded = function(geoms, mats) {
		this.onObjLoaded([geoms], mats)
	}

	ThreeLoaderModelPlugin.prototype.loadJson = function() {
		console.log('ThreeLoaderModelPlugin loading JSON', this.state.url)

		this.isLoading = true

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

		if (this.geometries)
			this.geometries = this.getDefaultGeometries()

		if (this.materials)
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
		//if (this.isLoading) {
		//	return []
		//}

		if (slot.index === 0) {
			return this.geometries
		}
		if (slot.index === 1) {
			return this.materials
		}
	}

})()

