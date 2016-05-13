(function() {

	var UrlStereoLatLongMap = E2.plugins.url_stereo_latlongmap_generator = function(core, node) {
		Plugin.apply(this, arguments)
		this.desc = 'Load a stereo latlong map from a URL. JPEG and PNG supported. Hover over the Browse button to select an existing image from the library.'

		this.input_slots = []

		this.output_slots = [
			{
				name: 'left',
				dt: core.datatypes.TEXTURE,
				desc: 'The left side of the loaded lat long map.'
			},
			{
				name: 'right',
				dt: core.datatypes.TEXTURE,
				desc: 'The right side of the loaded lat long map.'
			}
		]

		this.state = { url: '' }

		this.loadingTexture = E2.core.assetLoader.loadingTexture

		this.leftTexture = this.loadingTexture
		this.rightTexture = this.loadingTexture

		this.dirty = false
		this.thumbnail = null
	}

	UrlStereoLatLongMap.prototype = Object.create(Plugin.prototype)

	UrlStereoLatLongMap.prototype.create_ui = function() {
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
			.createTextureSelector(oldValue, function(control) {
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
						plugin: 'UrlStereoLatLongMap',
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

	UrlStereoLatLongMap.prototype.update_input = function() {}

	UrlStereoLatLongMap.prototype.update_state = function() {
		if (!this.dirty)
			return

		var that = this

		this.waitingToLoad = true

		this.leftTexture = this.loadingTexture
		this.rightTexture = this.loadingTexture

		E2.core.assetLoader
		.loadAsset('image', this.state.url)
		.then(function(img) {
			that.makeTexturesFromImage(img)
		})
		.catch(function() {
			that.leftTexture = that.defaultTexture
			that.rightTexture = that.defaultTexture
			that.waitingToLoad = false
			that.updated = true
		})

		this.dirty = false
	}

	UrlStereoLatLongMap.prototype.makeTexturesFromImage = function(img) {
		var imageWidth = img.width
		var imageHeight = img.height

		var tiles = 2

		var tileWidth = imageWidth
		var tileHeight = imageHeight / 2

		var textures = []

		for (var i = 0; i < tiles; ++i) {
			var tileCanvas = document.createElement('canvas')
			tileCanvas.width = tileWidth
			tileCanvas.height = tileHeight

			var ctx = tileCanvas.getContext('2d')
			ctx.drawImage(img, 0, i * tileHeight,
			tileWidth, tileHeight, 0, 0, tileWidth, tileHeight)

			textures.push(tileCanvas)
		}

		// left eye
		this.leftTexture = new THREE.Texture(textures[0])
		this.leftTexture.needsUpdate = true
		
		// right eye
		this.rightTexture = new THREE.Texture(textures[1])
		this.rightTexture.needsUpdate = true

		this.updated = true
	}

	UrlStereoLatLongMap.prototype.update_output = function(slot) {
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

	UrlStereoLatLongMap.prototype.state_changed = function() {
		if (!this.state.url)
			return

		this.updateUi()

		this.dirty = true
	}

	UrlStereoLatLongMap.prototype.updateUi = function() {
		if (this.thumbnail)
			this.thumbnail.css({ 'background-image': 'url(\'' + this.state.url + '\')' })
	}

})()