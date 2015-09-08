(function() {
	var ThreeMaterialModifier = E2.plugins.three_material_modifier = function(core, node) {
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


		this.lsg = new LinkedSlotGroup(core, node, [], [])
		this.lsg.set_dt(core.datatypes.MATERIAL)

		var that = this

		this.node.on('slotAdded', function () {
			that.dynInputs = node.getDynamicInputSlots()
			that.updated = true
			that.material_slots_dirty = true
		})

		this.node.on('slotRemoved', function () {
			that.dynInputs = node.getDynamicInputSlots()
			that.updated = true
			that.material_slots_dirty = true
		})
	}

	ThreeMaterialModifier.prototype = Object.create(Plugin.prototype)

	ThreeMaterialModifier.prototype.create_ui = function () {
		var that = this
		var layout = make('div')
		var removeButton = makeButton('Remove Slot', 'Click to remove the last material input.')
		var addButton = makeButton('Add Slot', 'Click to add another material input.')

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


	ThreeMaterialModifier.prototype.reset = function() {
		this.in_material_array = []
		this.out_material_array = []
		this.material_override = []

		this.material_slots_dirty = false
		this.materials_dirty = false
	}

	ThreeMaterialModifier.prototype.update_input = function(slot, data) {
		if (!slot.uid && slot.index === 0) {
			if (data && data.length > 0) {
				this.in_material_array = data

				this.material_names = []

				// filter only unique items to material_names
				var i, j
				for (j = 0; j < data.length; ++j) {
					var found = false
					for (i = 0; i < this.material_names.length; ++i) {
						if (data[j].name === this.material_names[i]) {
							found = true
						}
					}
					if (!found) {
						this.material_names.push(data[j].name)
					}
				}
				this.out_material_array = []

				this.material_slots_dirty = true
				this.materials_dirty = true
			}
		}
		else { // dynamic slot
			if (!data) {
				if (this.material_override[slot.index]) {
					delete this.material_override[slot.index]
				}
			}
			else {
				this.material_override[slot.index] = data
			}

			this.materials_dirty = true
		}
	}

	ThreeMaterialModifier.prototype.state_changed = function() {
		var slots = this.dynInputs = this.node.getDynamicInputSlots()
		for (var i = 0, len = slots.length; i < len; i++) {
			this.lsg.add_dyn_slot(slots[i])
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
				var n = this.in_material_array[i].name
				var overrideIdx = this.material_names.indexOf(n)
				if (overrideIdx >= 0 && this.material_override[overrideIdx]) {
					this.out_material_array.push(this.material_override[overrideIdx])
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
		var slots = this.dynInputs = this.node.getDynamicInputSlots()
		for (var i = 0, len = slots.length; i < len; i++) {
			this.node.rename_slot(slots[i].type, slots[i].uid, i < this.material_names.length ? this.material_names[i] : ('input ' + i))
		}

		//this.node.redraw_all_slots()
	}

})()