(function() {
	var StereoCubeMapPlugin = E2.plugins.stereo_cube_map = function (core, node) {
		Plugin.apply(this, arguments)

		this.desc = 'Stereo Cube Map'

		this.input_slots = []

		this.output_slots = [
			{
				name: 'texture',
				dt: core.datatypes.CUBETEXTURE
			}
		]

		var deftex = core.textureCache.defaultTexture

		this.defaultTexture = new THREE.CubeTexture([deftex, deftex, deftex, deftex, deftex, deftex])
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

			that.left_texture = new THREE.CubeTexture(textures.splice(0, 6))
			that.left_texture.needsUpdate = true

			that.right_texture = new THREE.CubeTexture(textures.splice(0, 6))
			that.right_texture.needsUpdate = true

			that.updated = true
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

	StereoCubeMapPlugin.prototype.update_output = function() {
		return this.left_texture ? this.left_texture : this.defaultTexture
	}

	StereoCubeMapPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			this.createTextures()
		}
	}
})()
