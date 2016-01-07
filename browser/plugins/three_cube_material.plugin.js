(function() {
	var ThreeCubeMaterial = E2.plugins.three_cube_material = function (core) {
		AbstractThreeMaterialPlugin.apply(this, arguments)

		this.desc = 'Cube Shader Material. '


		var deftex = E2.core.assetLoader.loadingTexture.image

		var defTexture = new THREE.CubeTexture([deftex, deftex, deftex, deftex, deftex, deftex])
		defTexture.needsUpdate = true


		this.input_slots = [{
			name:   'cube texture',
			dt:     core.datatypes.CUBETEXTURE,
			desc:   'Cube Texture',
			def:    defTexture
		}, {
			name:   'depthWrite',
			dt:     core.datatypes.BOOL,
			desc:   'enable / disable writing to the depth buffer',
			def:    false
		}].concat(this.input_slots)

		// fix up default material inputs
		for (var i = 0; i < this.input_slots.length; ++i) {
			if (this.input_slots[i].name === 'side') {
				// default side is 'double sided'
				this.input_slots[i].def = 2
			}
		}

		this.output_slots = [{
			name:   'material',
			dt:     core.datatypes.MATERIAL,
			desc:   'Cube Shader Material'
		}]

		var defaultUniforms = {
			tCube: { type: 't', value: defTexture },
			tFlip: { type: 'f', value: 1 }
		}

		var shader = THREE.ShaderLib.cube

		this.material = new THREE.ShaderMaterial({
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: defaultUniforms,
			depthWrite: false,
			side: THREE.DoubleSide
		})
	}

	ThreeCubeMaterial.prototype = Object.create(AbstractThreeMaterialPlugin.prototype)

	ThreeCubeMaterial.prototype.update_input = function(slot, data) {
		if (slot.name === 'cube texture') {
			this.material.uniforms.tCube.value = data

			this.material.needsUpdate = true
		}
		else {
			AbstractThreeMaterialPlugin.prototype.update_input.apply(this, arguments)
		}
	}

})()