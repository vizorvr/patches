(function() {
	var ThreeGroupPlugin = E2.plugins.three_group = function(core, node) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.node = node

		this.desc = 'Group several object3ds together so that they can be manipulated as one'

		this.input_slots = [].concat(this.input_slots)

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

		this.object3d = new THREE.Group()
		this.object3d.name = 'group_plugin'
		this.object3d.backReference = this
	}

	ThreeGroupPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeGroupPlugin.prototype.update_input = function(slot, data) {
		if (slot.dynamic) {
			var parent = this.object3d.children[slot.index]

			if (data) {
				if (slot.array) {
					parent.children = data

					for (var i = 0; i < data.length; ++i) {
						if (data[i].parent && data[i].parent !== parent) {
							// the object is in another scene, remove from there
							data[i].parent.remove(data[i])
						}

						data[i].parent = parent
						data[i].dispatchEvent({type: 'added'})
					}
				}
				else {
					if (data.parent && data.parent !== this) {
						// the objects is in another scene, remove from there
						data.parent.remove(data)
					}

					parent.children = [data]

					data.parent = parent
					data.dispatchEvent({type: 'added'})
				}
			}
			else {
				while (parent.children.length > 0) {
					parent.remove(parent.children[0])
				}
			}

			this.updatePivot()
		}
		else {
			ThreeObject3DPlugin.prototype.update_input.apply(this, arguments)
		}
	}

	ThreeGroupPlugin.prototype.connection_changed = function(on, conn, slot) {
		if (on && slot.dynamic) {
			// ensure there is a sufficient amount of slots
			while (this.object3d.children.length < this.dynInputs.length) {
				this.object3d.add(new THREE.Group())
			}
		}

		// disconnect
		if (!on && slot.type === E2.slot_type.input && slot.dynamic) {
			var parent = this.object3d.children[slot.index]

			while (parent.children.length > 0) {
				parent.remove(parent.children[0])
			}
		}

		// connect
		else if (on && slot.type === E2.slot_type.input && slot.dynamic) {
			this.object3d.children[slot.index].children = []
		}

		this.updatePivot()
	}

	ThreeGroupPlugin.prototype.state_changed = function(ui) {
		if (ui) {
			return
		}

		this.dynInputs = this.node.getDynamicInputSlots()

		if (!this.dynInputs.length) {
			this.node.add_slot(E2.slot_type.input, {
				name: '0',
				dt: E2.dt.OBJECT3D,
				array: false
			})

			this.dynInputs = this.node.getDynamicInputSlots()
		}

		for(var i = 0, len = this.dynInputs.length; i < len; i++) {
			this.lsg.add_dyn_slot(this.dynInputs[i])
			this.object3d.add(new THREE.Group())
		}

		this.lsg.infer_dt()
	}

	ThreeGroupPlugin.prototype.updatePivot = function() {
		var center = new THREE.Vector3()
		var count = 0

		// create a pivot centered around positions of meshes
		// connected to this group node
		for (var j = 0; j < this.object3d.children.length; ++j) {
			var parent = this.object3d.children[j]
			for (var i = 0; i < parent.children.length; ++i) {
				var obj = parent.children[i]

				if (obj.backReference) {
					center.x += obj.backReference.state.position.x
					center.y += obj.backReference.state.position.y
					center.z += obj.backReference.state.position.z
					++count
				}
			}
		}

		if (count) {
			center.divideScalar(count)
		}

		function applyRotation(v, m) {
			var x = v.x, y = v.y, z = v.z

			var e = m.elements

			v.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ]  * z
			v.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ]  * z
			v.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z

			return v
		}

		this.state.pivot = center
		var transformedPivot = applyRotation(center.clone(), this.object3d.matrix)

		for (var j = 0; j < this.object3d.children.length; ++j) {
			var parent = this.object3d.children[j]
			parent.position.set(transformedPivot.x, transformedPivot.y, transformedPivot.z)
		}
	}
})()
