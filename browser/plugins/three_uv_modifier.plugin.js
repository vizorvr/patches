(function() {
	var ThreeUVModifierPlugin = E2.plugins.three_uv_modifier = function(core, node) {
		Plugin.apply(this, arguments)

		this.desc = 'Adjust a texture\'s UV coordinates'

		this.input_slots = [{
			name: 'texture',
			dt: core.datatypes.TEXTURE,
			def: new THREE.Texture()
		}, {
			name: 'u offset',
			dt: core.datatypes.FLOAT,
			def: 0.0
		},  {
			name: 'v offset',
			dt: core.datatypes.FLOAT,
			def: 0.0
		}, {
			name: 'u repeat',
			dt: core.datatypes.FLOAT,
			def: 1.0
		},  {
			name: 'v repeat',
			dt: core.datatypes.FLOAT,
			def: 1.0
		},  {
			name: 'filter',
			dt: core.datatypes.FLOAT,
			def: 1.0,
			desc: 'Texture Filter - (0: nearest, 1: linear)'
		}]

		this.output_slots = [{
			name: 'texture',
			dt: core.datatypes.TEXTURE
		}]
	}

	ThreeUVModifierPlugin.prototype = Object.create(Plugin.prototype)

	ThreeUVModifierPlugin.prototype.reset = function() {
		this.texture = undefined
		this.uOffset = 0
		this.vOffset = 0
		this.uRepeat = 1
		this.vRepeat = 1

		this.dirty = false
	}

	ThreeUVModifierPlugin.prototype.update_input = function(slot, data) {
		if (slot.name === 'texture') { // texture
			if (data) {
				this.texture = data.clone()
				this.dirty = true
			}
			else {
				this.texture = undefined
			}
		}
		else if (slot.name === 'u offset') { // u offset
			this.uOffset = data
			this.dirty = true
		}
		else if (slot.name === 'v offset') { // v offset
			this.vOffset = data
			this.dirty = true
		}
		else if (slot.name === 'u repeat') { // u repeat
			this.uRepeat = data
			this.dirty = true
		}
		else if (slot.name === 'v repeat') { // v repeat
			this.vRepeat = data
			this.dirty = true
		}
		else if (slot.name === 'filter') { // filter
			this.filter = data
			this.dirty = true
		}
	}

	ThreeUVModifierPlugin.prototype.state_changed = function(ui) {
		if (ui) {
			return
		}
	}

	ThreeUVModifierPlugin.prototype.update_state = function() {

		if (this.dirty && this.texture) {
			this.texture.offset.set(this.uOffset, this.vOffset)
			this.texture.repeat.set(this.uRepeat, this.vRepeat)
			this.texture.magFilter = this.filter === 0 ? THREE.NearestFilter : THREE.LinearFilter
			this.texture.needsUpdate = true

			this.dirty = false
		}
	}

	ThreeUVModifierPlugin.prototype.update_output = function() {
		return this.texture
	}


})()