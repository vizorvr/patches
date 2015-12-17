(function() {
	var StereoCubeMapPlugin = E2.plugins.stereo_cube_map = function (core, node) {
		Plugin.apply(this, arguments)

		this.desc = 'Stereo Cube Map'

		this.input_slots = [
			{
				name: 'url',
				dt: core.datatypes.TEXT,
				def: ''
			}
		]

		this.output_slots = [
			{
				name: 'cube',
				dt: core.datatypes.OBJECT3D,
				array: true
			}
		]

		var deftex = E2.core.assetLoader.loadingTexture.image

		var defTexture = new THREE.CubeTexture([deftex, deftex, deftex, deftex, deftex, deftex])
		defTexture.needsUpdate = true


		var defShader = THREE.ShaderLib['cube']
		defShader.uniforms['tCube'].value = defTexture

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

	StereoCubeMapPlugin.prototype.loadTextures = function() {
		var textures = []

		var loader = new THREE.ImageLoader( THREE.DefaultLoadingManager );
		loader.setCrossOrigin( '' );

		var that = this

		loader.load( this.url, function ( img ) {
			var imageWidth = img.width
			var imageHeight = img.height

			var tiles = 12

			var tileWidth = imageWidth / tiles
			var tileHeight = imageHeight

			for (var i = 0; i < tiles; ++i) {
				var tileCanvas = document.createElement('canvas')
				tileCanvas.width = tileWidth
				tileCanvas.height = tileHeight

				var ctx = tileCanvas.getContext('2d')
				ctx.drawImage(img, i * tileWidth, 0, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight)

				textures.push(tileCanvas)
			}

			// left eye
			var leftTexture = new THREE.CubeTexture(textures.splice(0, 6))
			leftTexture.needsUpdate = true

			var shader = THREE.ShaderLib['cube']

			var leftUniforms = {
				"tCube": { type: "t", value: leftTexture },
				"tFlip": { type: "f", value: 1 } }

			var leftMaterial = new THREE.ShaderMaterial({
				fragmentShader: shader.fragmentShader,
				vertexShader: shader.vertexShader,
				uniforms: leftUniforms,
				depthWrite: false,
				side: THREE.DoubleSide
			})

			that.leftObj = new THREE.Mesh(
					new THREE.BoxGeometry(50, 50, 50),
					leftMaterial)

			that.leftObj.channels.set(that.leftChannel)

			// right eye
			var rightTexture = new THREE.CubeTexture(textures.splice(0, 6))
			rightTexture.needsUpdate = true

			var rightUniforms = {
				"tCube": { type: "t", value: rightTexture },
				"tFlip": { type: "f", value: 1 } }

			var rightMaterial = new THREE.ShaderMaterial({
				fragmentShader: shader.fragmentShader,
				vertexShader: shader.vertexShader,
				uniforms: rightUniforms,
				depthWrite: false,
				side: THREE.DoubleSide
			})

			that.rightObj = new THREE.Mesh(
				new THREE.BoxGeometry(50, 50, 50),
				rightMaterial)

			that.rightObj.channels.set(that.rightChannel)

			that.updated = true
		},
		undefined,
		function(e) {
			console.log('failed to load ' + that.url, e)
		})
	}

	StereoCubeMapPlugin.prototype.reset = function() {

	}

	StereoCubeMapPlugin.prototype.update_input = function(slot, data) {
		if (slot.name === 'url' && this.url !== data) {
			delete this.leftObj
			delete this.rightObj

			this.url = data

			this.loadTextures()
		}
	}

	StereoCubeMapPlugin.prototype.update_output = function(slot) {
		if (this.leftObj === undefined) {
			return [this.defaultObj]
		}

		return [this.leftObj, this.rightObj]
	}

	StereoCubeMapPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			this.loadTextures()
		}
	}
})()
