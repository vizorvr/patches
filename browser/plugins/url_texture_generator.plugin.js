(function() {

var UrlTexture = E2.plugins.url_texture_generator = function(core, node) {
	Plugin.apply(this, arguments)
	this.desc = 'Load a texture from a URL. JPEG and PNG supported. Hover over the Browse button to select an existing image from the library.'
	
	this.input_slots = []
	this.input_slots = [
		{ name: 'url', dt: core.datatypes.TEXT,
			desc: 'URL to fetch image from. The image width and height must be in powers of two, for example 256x512.',
			def: '' }
	]
	
	this.output_slots = [
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'The loaded texture.' }
	]
	
	this.state = { url: '' }
	this.gl = core.renderer.context
	this.texture = null
	this.dirty = false
	this.thumbnail = null
}
UrlTexture.prototype = Object.create(Plugin.prototype)

UrlTexture.prototype.create_ui = function() {
	var container = make('div')
	var inp = makeButton('Browse', 'No texture selected.', 'url')
	var that = this

	this.thumbnail = make('div')
	
	this.thumbnail.css({
		'width': '71px',
		'height': '71px',
		'z-index': '3003',
		'border': '2px solid #8e8e8e',
		'border-radius': '5px',
		'background-image': 'url(\'images/no_texture.png\')',
		'background-size': 'cover',
		'margin-bottom': '3px'
	})

	function clickHandler() {
		var oldValue = that.state.url
		var newValue = oldValue

		function setValue(v) {
			that.state.url = newValue = v
			that.updated = true
			that.state_changed()
		}

		FileSelectControl
		.createTextureSelector(oldValue, function(control) {
			control	
			.template('texture')
			.selected(oldValue)
			.onChange(setValue.bind(this))
			.buttons({
				'Cancel': setValue.bind(this),
				'Select': setValue.bind(this)
			})
			.on('closed', function() {
				if (newValue === oldValue)
					return;
			
				that.undoableSetState('url', newValue, oldValue)
			})
			.modal()
		})
	}

	inp.click(clickHandler)
	this.thumbnail.click(clickHandler)
	
	container.append(this.thumbnail)
	container.append(inp)

	return container
}

UrlTexture.prototype.update_input = function(slot, data) {
	if (this.state.url === data)
		return;
	this.state.url = data
	this.state_changed()
}

UrlTexture.prototype.update_state = function() {
	if (!this.dirty)
		return

	this.texture = this.core.renderer.texture_cache.get(this.state.url)
	this.dirty = false
}

UrlTexture.prototype.update_output = function() {
	return this.texture
}

UrlTexture.prototype.state_changed = function() {
	if (this.state.url !== '') {
		this.dirty = true

		if (this.thumbnail) {
			this.thumbnail.css({ 'background-image': 'url(\'' + this.state.url + '\')' })
		}
	}
}

})()