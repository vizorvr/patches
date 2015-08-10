(function() {
	var ThreeScenePlugin = E2.plugins.three_scene = function(core, node) {
		this.desc = 'THREE.js Scene'

		this.input_slots = []

		this.output_slots = [{
			name: 'scene',
			dt: core.datatypes.SCENE
		}]

		this.node = node

		this.lsg = new LinkedSlotGroup(core, node, [], [])
		this.lsg.set_dt(core.datatypes.MESH)

		this.node.on('slotAdded', function() {
			that.dynInputs = node.getDynamicInputSlots()
			that.updated = true
		})

		this.node.on('slotRemoved', function() {
			that.dynInputs = node.getDynamicInputSlots()
			that.updated = true
		})
	}

	ThreeScenePlugin.prototype.create_ui = function() {
		var that = this
		var layout = make('div')
		var removeButton = makeButton('Remove', 'Click to remove the last mesh input.')
		var addButton = makeButton('Add Mesh', 'Click to add another mesh input.')
		
		removeButton.css('width', '65px')
		addButton.css({ 'width': '65px', 'margin-top': '5px' })
		
		addButton.click(function() {
			E2.app.graphApi.addSlot(that.node.parent_graph, that.node, {
				type: E2.slot_type.input,
				name: that.dynInputs.length + '',
				dt: that.lsg.dt
			})
		})

		removeButton.click(function() {
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

	ThreeScenePlugin.prototype.reset = function() {
		console.log('reset scene')
		this.scene = new THREE.Scene()
	}

	ThreeScenePlugin.prototype.update_input = function(slot, data) {
		this.scene.add(data)
	}

	ThreeScenePlugin.prototype.update_output = function() {
		// console.log('update scene output')
		return this.scene
	}

	ThreeScenePlugin.prototype.state_changed = function(ui) {
		if (ui)
			return;

		var slots = this.dynInputs = this.node.getDynamicInputSlots()
		for(var i = 0, len = slots.length; i < len; i++) {
			this.lsg.add_dyn_slot(slots[i])
		}
	}

})()

