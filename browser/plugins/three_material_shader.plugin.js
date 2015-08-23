(function() {

	var ThreeShaderMaterialPlugin = E2.plugins.three_material_shader = function(core, node) {
		Plugin.apply(this, arguments)

		var that = this

		this.desc = 'Auto-generate a shader embedding user-defined main bodies tailored to correctly and optimally render the supplied mesh.'

		this.input_slots = []

		this.output_slots = [{
			name: 'material', dt: core.datatypes.MATERIAL
		}]

		this.state = {
			vs_src: '',
			ps_src: ''
		}

		this.core = core
		this.node = node
		this.slot_data = {}

		this.node.on('slotAdded', function(slot) {
			that.slot_data[slot.uid] = that.core.get_default_value(E2.slot_type.input, slot.dt)
			that.updated = that.dirty = true
			that._refreshEditor()
		})

		this.node.on('slotRemoved', function() {
			that.updated = that.dirty = true
			that._refreshEditor()
		})
	}

	ThreeShaderMaterialPlugin.prototype = Object.create(Plugin.prototype)

	ThreeShaderMaterialPlugin.prototype._refreshEditor = function() {
		var that = this
		if (this._editors) {
			_.each(this._editors, function(ed, which) {
				ed.setInputs(that.node.getDynamicInputSlots())
			})
		}
	}

	ThreeShaderMaterialPlugin.prototype.destroy_ui = function() {
		var that = this
		_.each(this._editors, function(ed, key) {
			if (ed.close) {
				ed.close()
				delete that._editors[key]
			}
		})
	}

	ThreeShaderMaterialPlugin.prototype.create_ui = function() {
		var that = this
		var layout = make('div')
		var vertexButton = makeButton('Vertex', 'Click to edit the vertex shader source.')
		var pixelButton = makeButton('Pixel', 'Click to edit the pixel shader source.')

		this._editors = {}

		function removeSlot(slotId) {
			E2.app.graphApi.removeSlot(that.node.parent_graph, that.node, slotId)
		}

		function addSlot(name, dt) {
			E2.app.graphApi.addSlot(that.node.parent_graph, that.node, {
				type: E2.slot_type.input,
				name: name,
				dt: dt
			})
		}

		vertexButton.css('width', '55px')
		pixelButton.css({ 'width': '55px', 'margin-top': '5px' })

		function createEditor(which, stateKey) {
			if (that._editors[which]) {
				that._editors[which].show()
				return
			}

			var title = [which, 'shader'].join(' ')

			that._editors[which] = E2.ShaderEditor
			.open(title, that.state[stateKey], that.node.getDynamicInputSlots())
			.on('closed', function() {
				delete that._editors[which]
			})
			.on('inputRemoved', function(slotUid, name) {
				removeSlot(slotUid, name)
			})
			.on('inputAdded', function(inputName, dt) {
				addSlot(inputName, dt)
			})
			.on('build', function() {
				that.updated = that.dirty = true
			})
			.on('changed', function(v) {
				if (v === that.state[stateKey])
					return;

				that.undoableSetState(stateKey, v, that.state[stateKey])
			})

			that._editors[which].stateKey = stateKey
			that._editors[which]._ace
		}

		vertexButton.click(function() {
			createEditor('vertex', 'vs_src')
		})

		pixelButton.click(function() {
			createEditor('pixel', 'ps_src')
		})

		layout.append(vertexButton)
		layout.append(make('br'))
		layout.append(pixelButton)

		return layout
	}

	ThreeShaderMaterialPlugin.prototype.connection_changed = function(on, conn, slot) {
		if (!on && slot.type === E2.slot_type.input) {
			//if(slot.index === 0)
			//	this.shader = null
		}
	}

	ThreeShaderMaterialPlugin.prototype.update_input = function(slot, data)
	{
		if(slot.uid === undefined)
		{
			console.log('ThreeShaderMaterialPlugin: undefined uid for slot ' + slot.index)
		}
		else
		{
			this.slot_data[slot.uid] = data;
		}
	};

	ThreeShaderMaterialPlugin.prototype.update_state = function()
	{
		if (!this.dirty) {
			return
		}

		var slots, slot

		slots = this.node.getDynamicInputSlots()

		var uniforms = {}

		for(var i=0; i < slots.length; i++) {
			var dt = ''
			slot = slots[i]
			var dtid = slot.dt.id

			if(dtid === dts.FLOAT.id)
				dt = 'f'
			else if(dtid === dts.TEXTURE.id)
				dt = 't'
			else if(dtid === dts.COLOR.id)
				dt = 'v4'
			else if(dtid === dts.MATRIX.id)
				dt = 'm4'
			else if(dtid === dts.VECTOR.id)
				dt = 'v3'

			uniforms[slot.name] = {type: dt, value: slot.uniform}
		}

		// rebuild the whole shader, could just update what's changed
		this.material = new THREE.ShaderMaterial( {
			uniforms: uniforms,
			attributes: {},
			vertexShader: this.state.vs_src,
			fragmentShader: this.state.ps_src
		} );

		this.dirty = false
	};

	ThreeShaderMaterialPlugin.prototype.reset = function() {
		this.material = new THREE.ShaderMaterial()

		this.state.vs_src = this.material.vertexShader
		this.state.ps_src = this.material.fragmentShader
	}

	ThreeShaderMaterialPlugin.prototype.update_output = function() {
		return this.material
	}

	ThreeShaderMaterialPlugin.prototype.state_changed = function(ui) {
		if(!ui) {
			this.dirty = false
		} else {
			this.core.add_aux_script('ace/src-noconflict/ace.js')
		}
	}

})();

