(function() {

	var UrlCubeMap = E2.plugins.url_cubemap_generator = function(core, node) {
		Plugin.apply(this, arguments)
		this.desc = 'Load a cubemap. JPEG and PNG supported. Click the Browse button to select an existing image from the library.'

		this.input_slots = []

		this.output_slots = [
			{
				name: 'texture',
				dt: core.datatypes.CUBETEXTURE,
				desc: 'The loaded cubemap.'
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

		this.texture = this.loadingTexture

		this.dirty = false
		this.thumbnail = null
	}

	UrlCubeMap.prototype = Object.create(Plugin.prototype)

	UrlCubeMap.prototype.create_ui = function() {
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
						plugin: 'UrlCubeMap',
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

	UrlCubeMap.prototype.update_input = function() {}

	UrlCubeMap.prototype.update_state = function() {
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
			that.texture = that.defaultTexture
			that.texture.needsUpdate = true
			that.waitingToLoad = false
		})
		.finally(function() {
			that.updated = true
		})

		this.dirty = false
	}

	UrlCubeMap.prototype.makeTexturesFromImage = function(img) {
		var imageWidth = img.width
		var imageHeight = img.height

		var tiles = 6

		var tileWidth = imageHeight
		var tileHeight = imageHeight

		var textures = []

		for (var i = 0; i < tiles; ++i) {
			var tileCanvas = document.createElement('canvas')
			tileCanvas.width = tileWidth
			tileCanvas.height = tileHeight

			var ctx = tileCanvas.getContext('2d')
			ctx.drawImage(img, i * tileWidth, 0,
			tileWidth, tileHeight, 0, 0, tileWidth, tileHeight)

			textures.push(tileCanvas)
		}

		var texture = new THREE.CubeTexture(textures)
		texture.format = THREE.RGBFormat
		texture.needsUpdate = true

		this.texture = texture

		this.updated = true
	}

	UrlCubeMap.prototype.update_output = function(slot) {
		if (this.waitingToLoad &&
		this.texture &&
		this.texture.image && this.texture.image.width !== 0)
		{
			// force an extra update through the graph
			// with a texture that has actual image data
			this.waitingToLoad = false
			this.updated = true
		}

		return this.texture
	}

	UrlCubeMap.prototype.state_changed = function() {
		if (!this.state.url)
			return

		this.updateUi()

		this.dirty = true
	}

	UrlCubeMap.prototype.updateUi = function() {
		if (this.thumbnail)
			this.thumbnail.css({ 'background-image': 'url(\'' + this.state.url + '\')' })
	}

})()