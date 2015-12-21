(function() {

	var UrlStereoCubeMap = E2.plugins.url_stereo_cubemap_generator = function(core, node) {
		Plugin.apply(this, arguments)
		this.desc = 'Load a stereo cubemap from a URL. JPEG and PNG supported. Hover over the Browse button to select an existing image from the library.'
		
		this.input_slots = []

		this.output_slots = [
			{
				name: 'left',
				dt: core.datatypes.TEXTURE,
				desc: 'The left side of the loaded stereo cubemap.'
			},
			{
				name: 'right',
				dt: core.datatypes.TEXTURE,
				desc: 'The right side of the loaded stereo cubemap.'
			}
		]
		
		this.state = { url: '' }
		this.texture = E2.core.assetLoader.defaultTexture
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

		var that = this

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

						mixpanel.track('UrlStereoCubeMap Texture Changed')
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

		this.texture = E2.core.assetLoader.loadingTexture

		E2.core.assetLoader
		.loadAsset('image', this.state.url)
		.then(function(img) {
			that.texture = texture
			that.waitingToLoad = false
			that.updated = true
		})
		.catch(function() {
			that.texture = E2.core.assetLoader.defaultTexture
			that.waitingToLoad = false
			that.updated = true
		})
		
		this.dirty = false
	}

	UrlStereoCubeMap.prototype.update_output = function() {
		if (this.waitingToLoad && this.texture && this.texture.image && this.texture.image.width !== 0) {
			// force an extra update through the graph with a texture that has
			// actual image data
			this.waitingToLoad = false
			this.updated = true
		}

		return this.texture
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