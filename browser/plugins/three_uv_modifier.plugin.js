(function() {
	var ThreeUVModifierPlugin = E2.plugins.three_uv_modifier = function(core, node) {
		Plugin.apply(this, arguments)

		this.desc = 'Adjust a texture\'s UV coordinates'

		this.input_slots = [{
			name: 'texture',
			dt: core.datatypes.TEXTURE
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
		if (slot.index === 0 && data) { // texture
			if (data.image === THREE.Texture.DEFAULT_IMAGE) {
				// store a reference - if the map is not there, the texture
				// hasn't loaded - force the node to update until one is loaded
				console.log('uv modifier - store pending texture', this)
				this.pendingTexture = data
				this.always_update = true
			}
			else {
				console.log('uv modifier - store texture', this)
				this.texture = data.clone()
				this.dirty = true
			}
		}
		else if (slot.index === 1) { // u offset
			this.uOffset = data
			this.dirty = true
		}
		else if (slot.index === 2) { // v offset
			this.vOffset = data
			this.dirty = true
		}
		else if (slot.index === 3) { // u repeat
			this.uRepeat = data
			this.dirty = true
		}
		else if (slot.index === 4) { // v repeat
			this.vRepeat = data
			this.dirty = true
		}
	}

	ThreeUVModifierPlugin.prototype.state_changed = function(ui) {
		if (ui) {
			return
		}
	}

	ThreeUVModifierPlugin.prototype.update_state = function() {
		console.log('uv modifier - update', this)
		if (this.pendingTexture && this.pendingTexture.image !== THREE.Texture.DEFAULT_IMAGE) {
			console.log('uv modifier - update state - create clone', this.pendingTexture.version)
			this.texture = this.pendingTexture.clone()
			//this.texture.version = this.pendingTexture.version + 1
			this.always_update = false
			this.pendingTexture = undefined
			this.dirty = true
		}

		if (this.dirty && this.texture) {
			console.log('uv modifier - set', this.texture.version)
			this.texture.offset.set(this.uOffset, this.vOffset)
			this.texture.repeat.set(this.uRepeat, this.vRepeat)
			this.texture.needsUpdate = true

			this.dirty = false
		}
	}

	ThreeUVModifierPlugin.prototype.update_output = function() {
		console.log('uv modifier - update output')
		return this.texture
	}


})()