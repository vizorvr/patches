(function() {
	var ThreeScenePlugin = E2.plugins.three_scene = function (core, node) {
		this.desc = 'THREE.js Scene'

		this.input_slots = [{
			name: 'environment',
			dt: core.datatypes.ENVIRONMENTSETTINGS,
			def: new E2.EnvironmentSettings()
		}]

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
		var addButton = makeButton('Add Slot', 'Click to add another Object3D input.')

		removeButton.css('width', '65px')
		addButton.css({'width': '65px', 'margin-top': '5px'})

		addButton.click(function () {
			E2.app.graphApi.addSlot(that.node.parent_graph, that.node, {
				type: E2.slot_type.input,
				name: that.dynInputs.length + '',
				dt: that.lsg.dt,
				array: true
			})
		})

		removeButton.click(function () {
			var inputs = that.dynInputs
			if (!inputs)
				return

			var suid = inputs[inputs.length - 1].uid
			E2.app.graphApi.removeSlot(that.node.parent_graph, that.node, suid)
		})

		layout.append(removeButton, '<br />', addButton);

		return layout
	}

	ThreeScenePlugin.prototype.update_meshes = function () {
		if (!this.meshes_dirty) {
			return
		}

		this.reset()

		if (this.envSettings) {
			this.scene.fog = this.envSettings.fog
		}

		for (mesh in this.meshes) {
			// {id: 0, mesh: mesh}

			if (this.meshes[mesh]) {
				if (this.meshes[mesh].length !== undefined) {
					for (var i=0; i < this.meshes[mesh].length; i++) {
						this.sceneRoot.add(this.meshes[mesh][i])
					}
				}
				else
					this.sceneRoot.add(this.meshes[mesh])
			}
		}

		// If lights have changed, we have to set affected materials as needing
		// to be updated. This would be better done in an analytical manner
		// and only update the ones that actually need updating; however we'll
		// just force update everything

		if (this.scene) {
			this.scene.traverse(function(node) {
				if (node.material !== undefined) {
					node.material.needsUpdate = true
				}
			})
		}

		this.meshes_dirty = false
	}

	ThreeScenePlugin.prototype.reset = function () {
		this.scene = new THREE.Scene()
		this.scene.backReference = this

		// add two children:
		// [0] is the main scene
		this.sceneRoot = new THREE.Object3D()
		this.scene.add(this.sceneRoot)

		// [1] is the overlay scene
		this.overlayRoot = new THREE.Object3D()
		this.scene.add(this.overlayRoot)

		this.meshes_dirty = true
	}

	ThreeScenePlugin.prototype.update_input = function (slot, data) {
		if (slot.dynamic) {
			if (this.meshes[slot.index] !== data) {
				this.meshes[slot.index] = data
				this.meshes_dirty = true
			}
		}
		else {
			// the only static input slot is environment settings
			this.envSettings = data
			this.meshes_dirty = true
		}
	}

	ThreeScenePlugin.prototype.connection_changed = function(on, conn, slot) {
		if (!on && slot.type === E2.slot_type.input && slot.dynamic) {
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
