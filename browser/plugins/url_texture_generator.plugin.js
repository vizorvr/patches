(function() {

	var UrlTexture = E2.plugins.url_texture_generator = function(core, node) {
		Plugin.apply(this, arguments)
		this.desc = 'Load a texture from a URL. JPEG and PNG supported. Hover over the Browse button to select an existing image from the library.'
		
		this.input_slots = []

		// #542
		/* this.input_slots = [
			{ name: 'url', dt: core.datatypes.TEXT,
				desc: 'URL to fetch image from. The image width and height must be in powers of two, for example 256x512.',
				def: '' }
		] */
		
		this.output_slots = [
			{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'The loaded texture.' }
		]
		
		this.state = { url: '' }
		this.texture = null
		this.dirty = false
		this.thumbnail = null
	}

	UrlTexture.prototype = Object.create(Plugin.prototype)

	UrlTexture.prototype.create_ui = function() {
		var container = make('div')
		// var inp = makeButton('Browse', 'No texture selected.', 'url')
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
			.createTextureSelector(oldValue, function(control) {
				control
					.template('texture')
					.selected(oldValue)
					.onChange(setValueFn)
					.buttons({
						'Cancel': setValueFn,
						'Select': setValueFn
					})
					.on('closed', function() {
						if (newValue === oldValue)
							return;

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

	UrlTexture.prototype.update_input = function(slot, data) {
	}

	UrlTexture.prototype.update_state = function() {
		if (!this.dirty)
			return

		this.texture = this.core.textureCache.get(this.state.url)
		
		// if the texture isn't ready, set a flag to indicate that we need to
		// send an extra update after the texture has finished loaded
		if (!this.texture.image || !this.texture.image.width === 0) {
			this.waitingToLoad = true
		}
		
		this.dirty = false
	}

	UrlTexture.prototype.update_output = function() {
		if (this.waitingToLoad && this.texture && this.texture.image && this.texture.image.width !== 0) {
			// force an extra update through the graph with a texture that has
			// actual image data
			this.waitingToLoad = false
			this.updated = true
		}

		return this.texture
	}

	UrlTexture.prototype.state_changed = function() {
		if (!this.state.url)
			return

		this.updateUi()

		this.dirty = true
	}

	UrlTexture.prototype.updateUi = function() {
		if (this.thumbnail)
			this.thumbnail.css({ 'background-image': 'url(\'' + this.state.url + '\')' })
	}

})()