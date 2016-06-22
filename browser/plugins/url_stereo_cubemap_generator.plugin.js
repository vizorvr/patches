(function() {

	var UrlStereoCubeMap = E2.plugins.url_stereo_cubemap_generator = function(core, node) {
		Plugin.apply(this, arguments)
		this.desc = 'Load a stereo cubemap. JPEG and PNG supported. Click the Browse button to select an existing image from the library.'
		
		this.input_slots = []

		this.output_slots = [
			{
				name: 'left',
				dt: core.datatypes.CUBETEXTURE,
				desc: 'The left side of the loaded stereo cubemap.'
			},
			{
				name: 'right',
				dt: core.datatypes.CUBETEXTURE,
				desc: 'The right side of the loaded stereo cubemap.'
			}
		]
		
		this.state = { url: '' }

		var loadTex = E2.core.assetLoader.loadingTexture.image
		this.loadingTexture = new THREE.CubeTexture([
			loadTex, loadTex, loadTex, loadTex, loadTex, loadTex
		])

		var defTex = E2.core.assetLoader.defaultTexture.image
		this.defaultTexture = new THREE.CubeTexture([
			defTex, defTex, defTex, defTex, defTex, defTex
		])

		this.leftTexture = this.loadingTexture
		this.rightTexture = this.loadingTexture

		this.dirty = false
		this.thumbnail = null
	}

	UrlStereoCubeMap.prototype = Object.create(Plugin.prototype)

	UrlStereoCubeMap.prototype.create_ui = function() {
		var container = make('div')
		var inp = NodeUI.makeSpriteSVGButton(
			NodeUI.makeSpriteSVG('vp-edit-icon', 'cmd_edit_graph'),
			'No texture selected'
		);
		inp.addClass('p_round');

		this.thumbnail = make('div').addClass('p_thumbnail');
		
		this.thumbnail.css({
			'background-image': 'url(\'images/no_texture.png\')',
			'background-size': 'cover'
		})

		var clickHandler = function() {
			var that = this;
			var oldValue = that.state.url
			var newValue = oldValue

			var setValueFn = function(v) {
				that.state.url = newValue = v
				that.updated = true
				that.state_changed();
				return true;
			};

			FileSelectControl
			.createStereoCubeMapSelector(oldValue, function(control) {
				control
					.template('texture')
					.selected(oldValue)
					.onChange(setValueFn)
					.buttons({
						'Cancel': setValueFn.bind(this, oldValue),
						'Select': setValueFn
					})
					.on('closed', function() {
						if (newValue === oldValue)
							return;

						E2.track({
							event: 'assetChanged',
							plugin: 'UrlStereoCubeMap',
							url: newValue
						})
						
						that.undoableSetState('url', newValue, oldValue)
					})
					.modal()
			});

			return false;
		}.bind(this);

		inp.click(clickHandler)
		this.thumbnail.click(clickHandler)
		
		container.append(this.thumbnail)
		container.append(inp)

		this.node.on('pluginStateChanged', this.updateUi.bind(this))

		return container
	}

	UrlStereoCubeMap.prototype.update_input = function() {}

	UrlStereoCubeMap.prototype.update_state = function() {
		if (!this.dirty)
			return

		var that = this

		this.waitingToLoad = true

		this.leftTexture = this.loadingTexture
		this.rightTexture = this.loadingTexture

		E2.core.assetLoader
		.loadAsset('image', this.state.url)
		.then(function(img) {
			that.waitingToLoad = false
			that.makeTexturesFromImage(img)
		})
		.catch(function() {
			that.leftTexture = that.defaultTexture
			that.rightTexture = that.defaultTexture
			this.leftTexture.needsUpdate = true
			this.rightTexture.needsUpdate = true
			that.waitingToLoad = false
		})
		.finally(function() {
			that.updated = true
		})
		
		this.dirty = false
	}

	UrlStereoCubeMap.prototype.makeTexturesFromImage = function(img) {
		var imageWidth = img.width
		var imageHeight = img.height

		var tiles = imageWidth / imageHeight

		var tileWidth = imageWidth / tiles
		var tileHeight = imageHeight

		var textures = []

		if (E2.util.isMobile.Android()) {
			// work around a problem on android (only) where drawing directly from an
			// img would create corrupted images
			var intermediateCanvas = document.createElement('canvas')
			intermediateCanvas.width = img.width
			intermediateCanvas.height = img.height
			intermediateCanvas.getContext('2d').drawImage(img, 0, 0, imageWidth, imageHeight, 0, 0, imageWidth, imageHeight)

			for (var i = 0; i < tiles; ++i) {
				var tileCanvas = document.createElement('canvas')
				tileCanvas.width = tileWidth
				tileCanvas.height = tileHeight

				var ctx = tileCanvas.getContext('2d')
				ctx.drawImage(intermediateCanvas, i * tileWidth, 0,
					tileWidth, tileHeight, 0, 0, tileWidth, tileHeight)

				textures.push(tileCanvas)
			}
		}
		else {
			for (var i = 0; i < tiles; ++i) {
				var tileCanvas = document.createElement('canvas')
				tileCanvas.width = tileWidth
				tileCanvas.height = tileHeight

				var ctx = tileCanvas.getContext('2d')
				ctx.drawImage(img, i * tileWidth, 0,
					tileWidth, tileHeight, 0, 0, tileWidth, tileHeight)

				textures.push(tileCanvas)
			}
		}

		var leftTextures = textures.splice(0, 6)
		var rightTextures = textures.length >= 6 ? textures.splice(0, 6) : leftTextures

		// left eye
		var leftTexture = new THREE.CubeTexture(leftTextures)
		leftTexture.format = THREE.RGBFormat
		leftTexture.needsUpdate = true

		// right eye
		var rightTexture = new THREE.CubeTexture(rightTextures)
		rightTexture.format = THREE.RGBFormat
		rightTexture.needsUpdate = true

		this.leftTexture = leftTexture
		this.rightTexture = rightTexture

		this.updated = true
	}

	UrlStereoCubeMap.prototype.update_output = function(slot) {
		if (this.waitingToLoad &&
			this.leftTexture && this.rightTexture &&
			this.leftTexture.image && this.leftTexture.image.width !== 0 &&
			this.rightTexture.image && this.rightTexture.image.width !== 0)
		{
			// force an extra update through the graph
			// with a texture that has actual image data
			this.waitingToLoad = false
			this.updated = true
		}

		return slot.index === 0 ? this.leftTexture : this.rightTexture
	}

	UrlStereoCubeMap.prototype.state_changed = function() {
		if (!this.state.url)
			return

		this.updateUi()

		this.dirty = true
	}

	UrlStereoCubeMap.prototype.updateUi = function() {
		if (this.thumbnail)
			this.thumbnail.css({ 'background-image': 'url(\'' + this.state.url + '\')' })
	}

})()