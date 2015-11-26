(function() {
	var StereoCubeMapPlugin = E2.plugins.stereo_cube_map = function (core, node) {
		Plugin.apply(this, arguments)

		this.desc = 'Stereo Cube Map'

		this.input_slots = []

		this.output_slots = [
			{
				name: 'left cube',
				dt: core.datatypes.OBJECT3D
			},
			{
				name: 'right cube',
				dt: core.datatypes.OBJECT3D
			}
		]

		var deftex = core.textureCache.defaultTexture.image

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
			new THREE.BoxGeometry(100, 100, 100),
			defMaterial)

	}

	StereoCubeMapPlugin.prototype = Object.create(Plugin.prototype)


	StereoCubeMapPlugin.prototype.createTextures = function() {
		var url = 'https://vr1.otoycdn.net/vr/pano/5542_3A5ABDE6-26A5-4EDC-8E00-CF0C2CE475FE_pano.png'
		//var url = 'https://labs.chaosgroup.com/wp-content/uploads/2015/07/Construct_ImminentCollision.jpg'

		var textures = []

		var loader = new THREE.ImageLoader( THREE.DefaultLoadingManager );
		loader.setCrossOrigin( '' );

		var that = this

		loader.load( url, function ( img ) {
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

			var leftShader = THREE.ShaderLib['cube']
			leftShader.uniforms['tCube'].value = leftTexture

			var leftMaterial = new THREE.ShaderMaterial({
				fragmentShader: leftShader.fragmentShader,
				vertexShader: leftShader.vertexShader,
				uniforms: leftShader.uniforms,
				depthWrite: false,
				side: THREE.DoubleSide
			})

			that.leftObj = new THREE.Mesh(
					new THREE.BoxGeometry(50, 50, 50),
					leftMaterial)

			that.leftObj.channels.set(1)

			// right eye
			var rightTexture = new THREE.CubeTexture(textures.splice(0, 6))
			rightTexture.needsUpdate = true

			var rightShader = THREE.ShaderLib['cube']
			rightShader.uniforms['tCube'].value = rightTexture

			var rightMaterial = new THREE.ShaderMaterial({
				fragmentShader: rightShader.fragmentShader,
				vertexShader: rightShader.vertexShader,
				uniforms: rightShader.uniforms,
				depthWrite: false,
				side: THREE.DoubleSide
			})

			that.rightObj = new THREE.Mesh(
				new THREE.BoxGeometry(50, 50, 50),
				rightMaterial)

			that.rightObj.channels.set(2)

			that.updated = true

			console.log('loaded ' + url)
		},
		function(x) {
			console.log('loading ' + url, x)
		},
		function(e) {
			console.log('failed to load ' + url, e)
		})
	}

	StereoCubeMapPlugin.prototype.reset = function() {

	}

	StereoCubeMapPlugin.prototype.update_output = function(slot) {
		if (this.leftObj === undefined) {
			return this.defaultObj
		}

		return slot.index === 0 ? this.leftObj : this.rightObj
	}

	StereoCubeMapPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			this.createTextures()
		}
	}
})()
