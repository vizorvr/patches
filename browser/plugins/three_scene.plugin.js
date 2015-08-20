(function() {
	var ThreeScenePlugin = E2.plugins.three_scene = function (core, node) {
		this.desc = 'THREE.js Scene'

		this.input_slots = []

		this.output_slots = [{
			name: 'scene',
			dt: core.datatypes.SCENE
		}]

		this.node = node

		this.lsg = new LinkedSlotGroup(core, node, [], [])
		this.lsg.set_dt(core.datatypes.OBJECT3D)

		var that = this

		this.node.on('slotAdded', function () {
			that.dynInputs = node.getDynamicInputSlots()
			that.updated = true
		})

		this.node.on('slotRemoved', function () {
			that.dynInputs = node.getDynamicInputSlots()
			that.updated = true
		})

		this.meshes = {}

		this.meshes_dirty = true
	}

	ThreeScenePlugin.prototype.create_ui = function () {
		var that = this
		var layout = make('div')
		var removeButton = makeButton('Remove', 'Click to remove the last mesh input.')
		var addButton = makeButton('Add Mesh', 'Click to add another mesh input.')

		removeButton.css('width', '65px')
		addButton.css({'width': '65px', 'margin-top': '5px'})

		addButton.click(function () {
			E2.app.graphApi.addSlot(that.node.parent_graph, that.node, {
				type: E2.slot_type.input,
				name: that.dynInputs.length + '',
				dt: that.lsg.dt
			})
		})

		removeButton.click(function () {
			var inputs = that.dynInputs
			if (!inputs)
				return

			var suid = inputs[inputs.length - 1].uid
			E2.app.graphApi.removeSlot(that.node.parent_graph, that.node, suid)
		})

		layout.append(removeButton)
		layout.append(make('br'))
		layout.append(addButton)

		return layout
	}

	ThreeScenePlugin.prototype.update_meshes = function () {
		if (!this.meshes_dirty) {
			return
		}

		this.reset()

		for (mesh in this.meshes) {
			// {id: 0, mesh: mesh}

			if (this.meshes[mesh]) {
				//console.log('add mesh to slot ', JSON.stringify(mesh))
				this.scene.children[0].add(this.meshes[mesh])
			}
			else {
				//console.log('no mesh for ', JSON.stringify(mesh))
			}
		}

		this.meshes_dirty = false
	}

	ThreeScenePlugin.prototype.reset = function () {
		this.scene = new THREE.Scene()

		// add two children:
		// [0] is the main scene
		this.scene.add(new THREE.Object3D())

		// [1] is the overlay scene
		this.scene.add(new THREE.Object3D())

		window._scene = this.scene

		this.meshes_dirty = true
	}

	ThreeScenePlugin.prototype.update_input = function (slot, data) {
		//if (!data)
		//	return;

		if (this.meshes[slot.index] != data) {
			//console.log("add mesh to scene " + JSON.stringify(slot))
			this.meshes[slot.index] = data
			this.meshes_dirty = true
		}
	}

	ThreeScenePlugin.prototype.connection_changed = function(on, conn, slot) {
		if (!on) {
			this.meshes[slot.index] = undefined
		}
		this.meshes_dirty = true
	}

	ThreeScenePlugin.prototype.update_output = function () {
		// console.log('update scene output')
		return this.scene
	}

	ThreeScenePlugin.prototype.state_changed = function (ui) {
		if (ui)
			return;

		var slots = this.dynInputs = this.node.getDynamicInputSlots()
		for (var i = 0, len = slots.length; i < len; i++) {
			this.lsg.add_dyn_slot(slots[i])
		}

		if (this.meshes_dirty) {
			this.update_meshes()
		}
	}

	ThreeScenePlugin.prototype.update_state = function () {
		if (this.meshes_dirty) {
			this.update_meshes()
		}
	}

})()
