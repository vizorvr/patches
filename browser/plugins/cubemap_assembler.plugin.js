(function() {
	var CubemapAssembler = E2.plugins.cubemap_assembler = function(core, node) {
		Plugin.apply(this, arguments)

		this.input_slots = [{
			name: "positive x", dt: E2.dt.TEXTURE,
			desc: "Positive X texture face"
		},{
			name: "negative x", dt: E2.dt.TEXTURE,
			desc: "Negative X texture face"
		},{
			name: "positive y", dt: E2.dt.TEXTURE,
			desc: "Positive Y texture face"
		},{
			name: "negative y", dt: E2.dt.TEXTURE,
			desc: "Negative Y texture face"
		},{
			name: "positive z", dt: E2.dt.TEXTURE,
			desc: "Positive Z texture face"
		},{
			name: "negative z", dt: E2.dt.TEXTURE,
			desc: "Negative Z texture face"
		}]

		this.output_slots = [{
			name: 'cube texture',
			dt: E2.dt.CUBETEXTURE
		}]
	}

	CubemapAssembler.prototype = Object.create(Plugin.prototype)

	CubemapAssembler.prototype.reset = function() {
	}

	CubemapAssembler.prototype.update_input = function() {
		this.cubemapDirty = true
	}

	CubemapAssembler.prototype.update_state = function() {
		if (this.cubemapDirty) {
			var deftex = E2.core.assetLoader.defaultTexture
			var textures = [
				(this.inputValues['positive x'] || deftex).image, (this.inputValues['negative x'] || deftex).image,
				(this.inputValues['positive y'] || deftex).image, (this.inputValues['negative y'] || deftex).image,
				(this.inputValues['positive z'] || deftex).image, (this.inputValues['negative z'] || deftex).image]

			this.cubemap = new THREE.CubeTexture(textures)
			this.cubemap.needsUpdate = true
			this.cubemap.format = THREE.RGBFormat
			this.cubemapDirty = false
		}
	}

	CubemapAssembler.prototype.update_output = function() {
		return this.cubemap
	}
})()