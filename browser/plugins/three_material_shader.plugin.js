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

		this.shader_dirty = true
		this.uniforms_dirty = true
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
				that.updated = that.shader_dirty = true
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
			this.uniforms_dirty = true
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
			this.slot_data[slot.uid] = data
			this.uniforms_dirty = true
		}
	}

	ThreeShaderMaterialPlugin.prototype.update_state = function()
	{
		if (!this.uniforms_dirty && !this.shader_dirty) {
			return
		}

		this.uniforms_dirty = this.uniforms_dirty || this.shader_dirty

		var dts = this.core.datatypes

		var slots, slot

		slots = this.node.getDynamicInputSlots()

		if (this.shader_dirty || !this.material) {
			var vs_src = this.state.vs_src.slice(0)
			var ps_src = this.state.ps_src.slice(0)

			this.uniforms = {}

			for(var i=0; i < slots.length; i++) {
				var three_dt = ''
				var shader_dt = ''

				slot = slots[i]
				var dtid = slot.dt.id

				if(dtid === dts.FLOAT.id) {
					three_dt = 'f'
					shader_dt = 'float'
				}
				else if(dtid === dts.TEXTURE.id) {
					three_dt = 't'
					shader_dt = 'sampler2D'
				}
				else if(dtid === dts.COLOR.id) {
					three_dt = 'v4'
					shader_dt = 'vec4'
				}
				else if(dtid === dts.MATRIX.id) {
					three_dt = 'm4'
					shader_dt = 'mat4'
				}
				else if(dtid === dts.VECTOR.id) {
					three_dt = 'v3'
					shader_dt = 'vec3'
				}

				this.uniforms[slot.name] = {type: three_dt/*, value: data*/}

				// add to shader source
				vs_src = 'uniform ' + shader_dt + ' ' + slot.name + ';\n' + vs_src
				ps_src = 'uniform ' + shader_dt + ' ' + slot.name + ';\n' + ps_src
			}

			this.material = new THREE.ShaderMaterial( {
				uniforms: this.uniforms,
				attributes: {},
				vertexShader: vs_src,
				fragmentShader: ps_src
			} )
		}

		if (this.uniforms_dirty) {
			for(var i=0; i < slots.length; i++) {
				slot = slots[i]
				var dtid = slot.dt.id
				var data = this.slot_data[slot.uid]

				/*if(dtid === dts.FLOAT.id) {
					// data as is
				}
				else if(dtid === dts.TEXTURE.id) {
					// data as is
				}
				else*/ if(dtid === dts.COLOR.id) {
					data = data ? new THREE.Color(data.x, data.y, data.z, data.w) : new THREE.Color()
				}
				else if(dtid === dts.MATRIX.id) {
					data = data ? new THREE.Matrix4(
						data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7],
						data[8], data[9], data[10], data[11], data[12], data[13], data[14], data[15]) : new THREE.Matrix4()
				}
				else if(dtid === dts.VECTOR.id) {
					data = data ? new THREE.Vector3(data.x, data.y, data.z) : new THREE.Vector3()
				}

				this.uniforms[slot.name]['value'] = data
			}
		}

		this.shader_dirty = false
		this.uniforms_dirty = false
	}

	ThreeShaderMaterialPlugin.prototype.reset = function() {
		this.material = new THREE.ShaderMaterial()

		this.state.vs_src = this.material.vertexShader
		this.state.ps_src = this.material.fragmentShader

		this.uniforms_dirty = this.shader_dirty = true
	}

	ThreeShaderMaterialPlugin.prototype.update_output = function() {
		return this.material
	}

	ThreeShaderMaterialPlugin.prototype.state_changed = function(ui) {
		if(!ui) {
			//this.shader_dirty = true
		} else {
			this.core.add_aux_script('ace/src-noconflict/ace.js')
		}
	}

})()

