(function() {
	var ThreeLoaderObjPlugin = E2.plugins.three_loader_obj = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js OBJ loader'
		
		// add slots above the ones from ThreeObject3DPlugin
		this.input_slots.unshift({ name: 'material', dt: core.datatypes.MATERIAL })
		this.input_slots.unshift({ name: 'url', dt: core.datatypes.TEXT })
	
		this.dirty = true
	}

	ThreeLoaderObjPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeLoaderObjPlugin.prototype.create_ui = function() {
		var inp = makeButton('Change', 'No scene selected.', 'url')
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

	ThreeLoaderObjPlugin.prototype.update_input = function(slot, data) {
		switch(slot.index) {
			case 0: // url
				if (this.state.url === data)
					return
				console.log('url changed in obj loader')
				this.state.url = data
				this.state_changed()
				break;
			case 1: // material
				this.material = this.object3d.material = data
				break;
			default:
				return ThreeObject3DPlugin.prototype.update_input
					.apply(this, arguments)
		}
	}

	ThreeLoaderObjPlugin.prototype.update_state = function() {
		if (!this.dirty)
			return

		var that = this

		if (this.object3d)
			this.object3d = null

		var loader = new THREE.OBJLoader()
		loader.load(this.state.url, function(obj) {
			msg('Finished loading '+ that.state.url)

			obj.traverse(function(child) {
				if (child instanceof THREE.Mesh) {
					child.material = that.material
				}
			})

			that.object3d = obj
			that.updated = true
		}, function() {
			console.log('Loading progress', that.state.url, arguments)
		}, function(err) {
			msg('ERROR: '+err.toString())
		})

		this.dirty = false
	}

	ThreeLoaderObjPlugin.prototype.state_changed = function(ui) {
		if (!this.state.url)
			return

		if (ui)
			ui.attr('title', this.state.url)
		else
			this.dirty = true
	}

})()

