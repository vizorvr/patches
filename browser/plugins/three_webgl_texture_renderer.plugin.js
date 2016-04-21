(function() {
	var ThreeWebGLTextureRendererPlugin = E2.plugins.three_webgl_texture_renderer = function(core) {
		this.desc = 'THREE.js WebGL Texture renderer'

		this.input_slots = [
			{
				name: 'camera',
				dt: core.datatypes.CAMERA,
				desc: 'Camera to use for rendering.'
			},
			{
				name: 'scene',
				dt: core.datatypes.SCENE,
				desc: 'Scene to render'
			},
			{
				name: 'bgcolor',
				dt: core.datatypes.COLOR,
				desc: 'Background color'
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

		this.width = 256
		this.height = 256
		this.texture_dirty = true,

		this.clearColor = new THREE.Color(0, 0, 0)
	}

	ThreeWebGLTextureRendererPlugin.prototype.reset = function() {
		this.scene = new THREE.Scene()

		this.perspectiveCamera = new THREE.PerspectiveCamera(
			90,
			1,
			0.1,
			1000)

		this.renderer = E2.core.renderer
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
			this.width = data
			this.texture_dirty = true
			break
		case 4: // height
			this.height = data
			this.texture_dirty = true
			break
		}
	}

	ThreeWebGLTextureRendererPlugin.prototype.create_texture = function() {
		this.texture = new THREE.WebGLRenderTarget(
			this.width,
			this.height,
			{ minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat } );

		this.texture_dirty = false
	}

	ThreeWebGLTextureRendererPlugin.prototype.update_state = function() {
		// have to reset as the main renderer will override these

		var oldPixelRatio = this.renderer.getPixelRatio()
		this.renderer.setPixelRatio(1)

		if (this.texture_dirty) {
			this.create_texture()
		}

		this.renderer.setClearColor(this.clearColor)

		this.renderer.setRenderTarget(this.texture)

		if (!this.scene || !this.perspectiveCamera) {
			this.renderer.clear()
			this.renderer.setPixelRatio(oldPixelRatio)

			return
		}

		// Render the scene through the manager.
		this.renderer.render(this.scene, this.perspectiveCamera, this.texture)

		// set render target to null as otherwise the next renderer will splat over
		// the render target we just rendered
		this.renderer.setRenderTarget(null)
		this.renderer.setPixelRatio(oldPixelRatio)
	}

	ThreeWebGLTextureRendererPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			console.log('state_changed')
		}
	}
	
	ThreeWebGLTextureRendererPlugin.prototype.update_output = function() {
		return this.texture
	}

})()
