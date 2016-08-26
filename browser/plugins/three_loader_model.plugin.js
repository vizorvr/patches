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

					E2.track({
						event: 'assetChanged',
						plugin: 'ThreeLoaderModelPlugin',
						url: v
					})
				})
				.on('closed', function() {
					if (newValue === oldValue)
						return

					that.undoableSetState('url', newValue, oldValue)
				})
		})

		return inp
	}

	ThreeLoaderModelPlugin.prototype.update_state = function() {
		if (!this.dirty)
			return

		if (!this.state.url)
			return;

		var that = this

		this.geometries = this.getDefaultGeometries()
		this.materials = this.getDefaultMaterials()

		console.log('ThreeLoaderModelPlugin loading', this.state.url)

		E2.core.assetLoader
		.loadAsset('model', this.state.url)
		.then(function(asset) {
			that.onObjLoaded(asset.geometries, asset.materials)
		})

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

