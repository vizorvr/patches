(function() {
	var ThreeMaterialModifier = E2.plugins.three_material_modifier = function(core) {
		Plugin.apply(this, arguments)

		this.input_slots = [
			{
				name: 'material',
				dt: core.datatypes.MATERIAL,
				array: true,
				def: [new THREE.MeshBasicMaterial({name: 'default material', color: 0x00FF00})]
			}
		]

		this.output_slots = [
			{
				name: 'material',
				dt: core.datatypes.MATERIAL,
				array: true
			}
		]
	}

	ThreeMaterialModifier.prototype = Object.create(Plugin.prototype)

	ThreeMaterialModifier.prototype.reset = function() {
		this.in_material_array = []
		this.out_material_array = []
		this.material_override = {}

		this.material_slots_dirty = false
		this.materials_dirty = false
	}

	ThreeMaterialModifier.prototype.update_input = function(slot, data) {
		if (!slot.uid && slot.index === 0) {
			if (data) {
				if (this.in_material_array.length === data.length) {
					for (var i = 0; i < this.in_material_array.length; ++i) {
						if (this.in_material_array[i] != data[i]) {
							break
						}
					}

					if (i === this.in_material_array.length) {
						// nothing's changed
						return
					}
				}

				this.in_material_array = data
				this.out_material_array = []

				this.material_slots_dirty = true
				this.materials_dirty = true
			}
		}
		else { // dynamic slot
			if (!data) {
				if (slot.name in this.material_override) {
					delete this.material_override[slot.name]
				}
			}
			else {
				this.material_override[slot.name] = data
			}

			this.materials_dirty = true
		}
	}

	ThreeMaterialModifier.prototype.update_state = function() {
		if (this.material_slots_dirty) {
			this.adjustMaterialSlots()
			this.material_slots_dirty = false
		}

		if (this.materials_dirty) {
			this.out_material_array = []
			for(var i = 0; i < this.in_material_array.length; i++) {
				var n = this.in_material_array[i].name || "default material"
				if (n in this.material_override) {
					this.out_material_array.push(this.material_override[n])
				}
				else {
					this.out_material_array.push(this.in_material_array[i])
				}
			}
			this.materials_dirty = false
		}
	}

	ThreeMaterialModifier.prototype.update_output = function() {
		return this.out_material_array
	}

	ThreeMaterialModifier.prototype.adjustMaterialSlots = function() {
		var that = this
		var materialSlots = this.node.getDynamicInputSlots()
		var materialNames = []

		for (var i = 0; i < this.in_material_array.length; ++i) {
			materialNames.push(this.in_material_array[i].name || 'default material' + (i == 0 ? '' : i))
		}

		// filter out any old material slots that don't belong to this obj
		materialSlots.slice().map(function(mSlot) {
			if (materialNames.indexOf(mSlot.name) === -1) {
				that.node.remove_slot(E2.slot_type.input, mSlot.uid)

				// also remove from the overrides table
				if (mSlot.name in that.material_override)
					delete that.material_override[mSlot.name]
			}
		})

		// then check that all the material slots of this obj are there
		materialNames.map(function(matName) {
			var found = materialSlots.some(function(mSlot) {
				return (mSlot.name === matName)
			})

			if (!found) {
				var slotUid = (that.node.uid + matName).replace(/[\W_]/g, '')

				that.node.add_slot(E2.slot_type.input, {
					dt: E2.dt.MATERIAL,
					uid: slotUid,
					name: matName
				})
			}
		})
	}

})()