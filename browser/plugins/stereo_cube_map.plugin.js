(function() {
	var StereoCubeMapPlugin = E2.plugins.stereo_cube_map = function (core) {
		Plugin.apply(this, arguments)

		this.desc = 'Stereo Cube Map'

		this.input_slots = [{
				name: 'left',
				dt: core.datatypes.CUBETEXTURE,
				desc: 'The left side of the stereo cubemap.'
			},
			{
				name: 'right',
				dt: core.datatypes.CUBETEXTURE,
				desc: 'The right side of the stereo cubemap.'
			}
		]

		this.output_slots = [{
				name: 'cube',
				dt: core.datatypes.OBJECT3D,
				array: true
			}
		]

		var deftex = E2.core.assetLoader.loadingTexture.image

		var defTexture = new THREE.CubeTexture([deftex, deftex, deftex, deftex, deftex, deftex])
		defTexture.needsUpdate = true

		var defShader = THREE.ShaderLib.cube
		defShader.uniforms.tCube.value = defTexture

		var defMaterial = new THREE.ShaderMaterial({
			fragmentShader: defShader.fragmentShader,
			vertexShader: defShader.vertexShader,
			uniforms: defShader.uniforms,
			depthWrite: false,
			side: THREE.BackSide
		})

		this.defaultObj = new THREE.Mesh(
			new THREE.BoxGeometry(50, 50, 50),
			defMaterial)
		
		this.leftChannel = 1
		this.rightChannel = 2

	}

	StereoCubeMapPlugin.prototype = Object.create(Plugin.prototype)

	StereoCubeMapPlugin.prototype.updateMesh = function() {
		var shader = THREE.ShaderLib.cube
		if (!this.url)
			return;


		// left eye
		var leftUniforms = {
			tCube: { type: 't', value: this.leftTexture },
			tFlip: { type: 'f', value: 1 }
		}

		var leftMaterial = new THREE.ShaderMaterial({
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: leftUniforms,
			depthWrite: false,
			side: THREE.DoubleSide
		})

		this.leftObj = new THREE.Mesh(
				new THREE.BoxGeometry(50, 50, 50),
				leftMaterial)

		this.leftObj.channels.set(this.leftChannel)

		// right eye
		var rightUniforms = {
			tCube: { type: 't', value: this.rightTexture },
			tFlip: { type: 'f', value: 1 }
		}

		var rightMaterial = new THREE.ShaderMaterial({
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: rightUniforms,
			depthWrite: false,
			side: THREE.DoubleSide
		})

		this.rightObj = new THREE.Mesh(
			new THREE.BoxGeometry(50, 50, 50),
			rightMaterial)

		this.rightObj.channels.set(this.rightChannel)

		this.updated = true
	}

	StereoCubeMapPlugin.prototype.reset = function() {
	}

	StereoCubeMapPlugin.prototype.update_input = function(slot, data) {
		if (slot.index === 0)
			this.leftTexture = data
		else
			this.rightTexture = data

		if (this.leftTexture && this.rightTexture && 
			this.leftTexture.image && this.rightTexture.image)
			this.updateMesh()
	}

	StereoCubeMapPlugin.prototype.update_output = function() {
		if (this.leftObj === undefined) {
			return [this.defaultObj]
		}

		return [this.leftObj, this.rightObj]
	}

	StereoCubeMapPlugin.prototype.state_changed = function() {
	}
})()
