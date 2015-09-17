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
			that.materialSlotsDirty = true
		})

		this.node.on('slotRemoved', function () {
			that.dynInputs = node.getDynamicInputSlots()
			that.updated = true
			that.materialSlotsDirty = true
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
		this.inMaterialArray = []
		this.outMaterialArray = []
		this.materialOverride = []

		this.materialSlotsDirty = false
		this.materialsDirty = false
	}

	ThreeMaterialModifier.prototype.update_input = function(slot, data) {
		if (!slot.uid && slot.index === 0) {
			if (data && data.length > 0) {
				this.inMaterialArray = data

				this.materialNames = []

				// filter only unique items to materialNames
				var i, j
				for (j = 0; j < data.length; ++j) {
					var found = false
					for (i = 0; i < this.materialNames.length; ++i) {
						if (data[j].name === this.materialNames[i]) {
							found = true
						}
					}
					if (!found) {
						this.materialNames.push(data[j].name)
					}
				}
				this.outMaterialArray = []

				this.materialSlotsDirty = true
				this.materialsDirty = true
			}
		}
		else { // dynamic slot
			if (!data) {
				if (this.materialOverride[slot.index]) {
					delete this.materialOverride[slot.index]
				}
			}
			else {
				this.materialOverride[slot.index] = data
			}

			this.materialsDirty = true
		}
	}

	ThreeMaterialModifier.prototype.state_changed = function(ui) {
		if (ui) {
			return
		}

		var slots = this.dynInputs = this.node.getDynamicInputSlots()
		for (var i = 0, len = slots.length; i < len; i++) {
			this.lsg.add_dyn_slot(slots[i])
		}
	}

	ThreeMaterialModifier.prototype.update_state = function() {
		if (this.materialSlotsDirty) {
			this.adjustMaterialSlots()
			this.materialSlotsDirty = false
		}

		if (this.materialsDirty) {
			this.outMaterialArray = []
			for(var i = 0; i < this.inMaterialArray.length; i++) {
				var n = this.inMaterialArray[i].name
				var overrideIdx = this.materialNames.indexOf(n)
				if (overrideIdx >= 0 && this.materialOverride[overrideIdx]) {
					this.outMaterialArray.push(this.materialOverride[overrideIdx])
				}
				else {
					this.outMaterialArray.push(this.inMaterialArray[i])
				}
			}
			this.materialsDirty = false
		}
	}

	ThreeMaterialModifier.prototype.update_output = function() {
		return this.outMaterialArray
	}

	ThreeMaterialModifier.prototype.adjustMaterialSlots = function() {
		var slots = this.dynInputs = this.node.getDynamicInputSlots()
		for (var i = 0, len = slots.length; i < len; i++) {
			this.node.rename_slot(
				slots[i].type, 
				slots[i].uid,
				i < this.materialNames.length ? this.materialNames[i] : ('input ' + i))
		}
	}

})()