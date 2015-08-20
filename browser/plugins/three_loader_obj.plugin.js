(function() {
	var ThreeLoaderObjPlugin = E2.plugins.three_loader_obj = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js OBJ loader'
		
		// add slots above the ones from ThreeObject3DPlugin
		this.input_slots.unshift({ name: 'material', dt: core.datatypes.MATERIAL })
		this.input_slots.unshift({ name: 'url', dt: core.datatypes.TEXT })
	
		this.dirty = true

		this.state = {
			materialCount: 0
		}
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
		switch(slot.name) {
			case 'url': // url
				if (this.state.url === data)
					return
				console.log('url changed in obj loader')
				this.state.url = data
				this.state_changed()
				break;
			case 'material': // material
				this.material = data
				if (this.object3d)
					this.object3d.material = this.material
				break;
			default:
				return ThreeObject3DPlugin.prototype.update_input
					.apply(this, arguments)
		}
	}

	ThreeLoaderObjPlugin.prototype.adjustMaterialSlots = function(materialCount) {
		var materialSlots = this.node.getDynamicInputSlots()

		console.log('adjustMaterialSlots', materialSlots.length, materialCount)

		while (materialSlots.length > materialCount)
			this.node.remove_slot(materialSlots[materialSlots.length - 1])

		while (materialSlots.length < materialCount) {
			this.node.add_slot(E2.slot_type.input, {
				dt: E2.dt.MATERIAL,
				uid: this.node.uid + 'material' + (materialSlots.length + 1),
				name: 'material' + (materialSlots.length + 1)
			})
		}

		console.log('adjustMaterialSlots after', materialSlots.length)
	}

	ThreeLoaderObjPlugin.prototype.update_state = function() {
		if (!this.dirty)
			return

		var that = this

		if (this.object3d)
			this.object3d = null

		var loader = new THREE.OBJLoader()
		loader.load(this.state.url, function(obj) {
			that.object3d = obj
			that.object3d.material = that.material

			msg('Finished loading '+ that.state.url)

			var objMaterialCount = 0

			obj.traverse(function(child) {
				if (child instanceof THREE.Mesh) {
					console.log('child', child)
					var inputMaterial = that.inputValues['material' + objMaterialCount]
					child.material = inputMaterial || that.material
					objMaterialCount++
				}
			})

			console.log('Found', objMaterialCount, 'materials')
			that.adjustMaterialSlots(objMaterialCount)

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

