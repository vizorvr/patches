(function() {
	var ThreeWebGLTextureRendererPlugin = E2.plugins.three_webgl_texture_renderer = function(core) {
		this.desc = 'THREE.js WebGL Texture renderer'

		this.input_slots = [
			{
				name: 'camera',
				dt: core.datatypes.CAMERA,
				desc: 'Camera to use for rendering.',
				def: null
			},
			{
				name: 'scene',
				dt: core.datatypes.SCENE,
				desc: 'Scene to render',
				def: null
			},
			{
				name: 'bgcolor',
				dt: core.datatypes.COLOR,
				desc: 'Background color',
				def: null
			},
			{
				name: 'width',
				dt: core.datatypes.FLOAT,
				desc: 'texture width',
				def: 256
			},
			{
				name: 'height',
				dt: core.datatypes.FLOAT,
				desc: 'texture height',
				def: 256
			}
		]

		this.output_slots = [{name: 'texture', dt: core.datatypes.TEXTURE, desc: 'render target texture'}]

		this.state = { texture_dirty: true, width: 256, height: 256}

		this.clearColor = new THREE.Color(0, 0, 0)
	}

	ThreeWebGLTextureRendererPlugin.prototype.reset = function() {
		this.domElement = E2.dom.webgl_canvas[0]

		console.log('reset',
		this.domElement.clientWidth,
		this.domElement.clientHeight,
		this.domElement.clientWidth / this.domElement.clientHeight)

		this.scene = new THREE.Scene()

		this.perspectiveCamera = new THREE.PerspectiveCamera(
			90,
			this.domElement.clientWidth / this.domElement.clientHeight,
			0.1,
			1000)
	}

	ThreeWebGLTextureRendererPlugin.prototype.update_input = function(slot, data) {
		switch(slot.index) {
		case 0: // camera
			this.perspectiveCamera = data
			break
		case 1: // scene
			this.scene = data
			break
		case 2: // clear color
			this.clearColor = new THREE.Color(data.r, data.g, data.b)
			break
		case 3: // width
			this.state.width = data
			this.state.texture_dirty = true
			break
		case 4:
			this.state.height = data
			this.state.texture_dirty = true
			break
		}
	}

	ThreeWebGLTextureRendererPlugin.prototype.create_texture = function() {
		this.texture = new THREE.WebGLRenderTarget(
			this.state.width,
			this.state.height,
			{ minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat } );

		this.state.texture_dirty = false
	}

	ThreeWebGLTextureRendererPlugin.prototype.update_state = function() {
		// have to reset as the main renderer will override these
		this.renderer.setPixelRatio(1)
		this.renderer.setClearColor(this.clearColor)

		if (!this.scene || !this.perspectiveCamera) {
			this.renderer.clear()

			return
		}

		if (this.state.texture_dirty) {
			this.create_texture()
		}

		// Render the scene through the manager.
		this.renderer.render(this.scene, this.perspectiveCamera, this.texture)
	}

	ThreeWebGLTextureRendererPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			console.log('state_changed')
			this.domElement = E2.dom.webgl_canvas[0]
			this.renderer = E2.core.renderer

			//this.renderer.setPixelRatio(window.devicePixelRatio)

		}
	}
	
	ThreeWebGLTextureRendererPlugin.prototype.update_output = function() {
		return this.texture
	}

})()
