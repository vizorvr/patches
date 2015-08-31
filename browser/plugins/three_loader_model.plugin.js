(function() {
	function progress() {
		console.log('Loading progress', this.state.url, arguments)
	}

	function errorHandler(err) {
		msg('ERROR: '+err.toString())
	}

	var ThreeLoaderModelPlugin = E2.plugins.three_loader_model = function(core) {
		AbstractThreeLoaderObjPlugin.apply(this, arguments)
		
		this.input_slots = [
			{
				name: 'delta', 
				dt: core.datatypes.FLOAT,
				desc: 'Delta time for animation'
			}
		].concat(this.input_slots)
	}

	ThreeLoaderModelPlugin.prototype = Object.create(AbstractThreeLoaderObjPlugin.prototype)

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

		if (loadMaterial)
			new THREE.OBJMTLLoader()
				.load(this.state.url, mtlUrl, this.onObjLoaded.bind(this), progress.bind(this), errorHandler)
		else
			new THREE.OBJLoader()
				.load(this.state.url, this.onObjLoaded.bind(this), progress.bind(this), errorHandler)
	}

	ThreeLoaderModelPlugin.prototype.onJsonModelLoaded = function(geometry, materials) {
		console.log('onJsonModelLoaded', geometry, materials)
		
		var meshAnim = this.object3d = new THREE.MorphAnimMesh(geometry, materials[0])
		this.meshAnim = meshAnim

		this.onObjLoaded(this.object3d)
	}

	ThreeLoaderModelPlugin.prototype.loadJson = function() {
		console.log('ThreeLoaderModelPlugin loading JSON', this.state.url)

		new THREE.JSONLoader()
			.load(this.state.url,
				this.onJsonModelLoaded.bind(this),
				progress.bind(this),
				errorHandler
			)
	}

	ThreeLoaderModelPlugin.prototype.update_input = function(slot, data) {
		if (slot.name === 'delta' && this.meshAnim)
			this.meshAnim.updateAnimation(data * 1000)
		else
			AbstractThreeLoaderObjPlugin.prototype.update_input.apply(this, arguments)
	}

	ThreeLoaderModelPlugin.prototype.update_state = function() {
		if (!this.dirty)
			return

		if (!this.state.url)
			return;

		if (this.object3d)
			this.object3d = null

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


})()

