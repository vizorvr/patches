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

		this.lsg = new AutoSlotGroup(core, node, [], [])
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

		this.clickableObjectsInSlot = []

		this.createScene()
	}

	ThreeScenePlugin.prototype.createScene = function() {
		this.scene = new THREE.Scene()
		this.scene.backReference = this

		// add two children:
		// [0] is the main scene
		this.sceneRoot = new THREE.Group()
		this.scene.add(this.sceneRoot)

		// [1] is the overlay scene
		this.overlayRoot = new THREE.Group()
		this.scene.add(this.overlayRoot)
	}

	ThreeScenePlugin.prototype.update_meshes = function () {
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
	}

	ThreeScenePlugin.prototype.reset = function () {
	}

	ThreeScenePlugin.prototype.update_input = function (slot, data) {
		var that = this
		var i

		this.clickableObjectsInSlot[slot.index] = 0

		if (slot.dynamic) {
			var parent = this.scene.children[0].children[slot.index]

			if (data) {
				if (slot.array) {
					parent.children = data

					for (i = 0; i < data.length; ++i) {
						if (data[i].parent && data[i].parent !== parent) {
							// the object is in another scene, remove from there
							data[i].parent.remove(data[i])
						}

						data[i].parent = parent
						data[i].dispatchEvent({ type: 'added' })

						if (data[i].gazeClickerCount)
							that.clickableObjectsInSlot[slot.index] += data[i].gazeClickerCount
					}
				}
				else {
					if (data.parent && data.parent !== this) {
						// the objects is in another scene, remove from there
						data.parent.remove(data)
					}

					parent.children = [data]

					data.parent = parent
					data.dispatchEvent({ type: 'added' })

					if (data.gazeClickerCount)
						that.clickableObjectsInSlot[slot.index] += data.gazeClickerCount
				}
			}
			else {
				while (parent.children.length > 0) {
					parent.remove(parent.children[0])
				}
			}
			this.update_meshes()
		}
		else {
			// the only static input slot is environment settings
			this.envSettings = data
		}

		var totalClickables = 0
		for (i=0; i < this.clickableObjectsInSlot.length; i++)
			totalClickables += this.clickableObjectsInSlot[i]

		this.scene.hasClickableObjects = totalClickables > 0
	}

	ThreeScenePlugin.prototype.connection_changed = function(on, conn, slot) {
		if (on && slot.dynamic) {
			// ensure there is a sufficient amount of slots
			var mainSceneRoot = this.scene.children[0]
			while (mainSceneRoot.children.length < this.dynInputs.length) {
				mainSceneRoot.add(new THREE.Group())
			}
		}

		// disconnect
		if (!on && slot.type === E2.slot_type.input && slot.dynamic) {
			var parent = this.scene.children[0].children[slot.index]

			while (parent.children.length > 0) {
				parent.remove(parent.children[0])
			}
		}

		// connect
		else if (on && slot.type === E2.slot_type.input && slot.dynamic) {
			this.scene.children[0].children[slot.index].children = []
		}

		this.update_meshes()
	}

	ThreeScenePlugin.prototype.update_output = function () {
		return this.scene
	}

	ThreeScenePlugin.prototype.state_changed = function (ui) {
		if (ui)
			return;

		var slots = this.dynInputs = this.node.getDynamicInputSlots()
		for (var i = 0, len = slots.length; i < len; i++) {
			this.lsg.add_dyn_slot(slots[i])
			this.scene.children[0].add(new THREE.Group())
		}
	}

	ThreeScenePlugin.prototype.update_state = function () {
	}

})()
