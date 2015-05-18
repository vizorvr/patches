(function() {

var UrlJson = E2.plugins["url_json_generator"] = function(core, node) {
	Plugin.apply(this, arguments)
	this.desc = 'Load JSON as an object from an URL. Hover over the Source button to see the url of the current file.';
	
	this.input_slots = [
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'Use this to load from a URL supplied as a string.', def: '' }
	];
	
	this.output_slots = [
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'The object if one has been selected.' }
	];
	
	this.state = { url: '' };
	this.core = core;
	this.object = {};
	this.dirty = false;
}
UrlJson.prototype = Object.create(Plugin.prototype)

UrlJson.prototype.create_ui = function() {
	var inp = makeButton('Source', 'No JSON selected.', 'url');
	var that = this;

	function clickHandler() {
		var oldValue = that.state.url
		var newValue = oldValue

		function setValue(v) {
			that.state.url = newValue = v
			that.updated = true
			that.state_changed()
		}

		FileSelectControl
		.createModelSelector('json', oldValue, function(control) {
			control
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

	return inp;
}

UrlJson.prototype.update_input = function(slot, data) {
	if (this.state.url === data)
		return;
	this.state.url = data
	this.state_changed()
}

UrlJson.prototype.update_state = function() {
	if(!this.dirty)
		return;
	
	var self = this;

	this.object = {};
	this.core.asset_tracker.signal_started();

	$.ajax({
		url: this.state.url, 
		dataType: 'json',
		success: function(self) { return function(data) 
		{
			self.object = data;
			self.core.asset_tracker.signal_completed();
			self.updated = true
		}}(self),
		error: function(self) { return function(jqXHR, textStatus, errorThrown)
		{
			msg('ERROR: Failed to load JSON "' + self.state.url + '": ' + textStatus + ', ' + errorThrown);
			self.state.url = '';
			self.object = {}
			self.core.asset_tracker.signal_failed();
		}}(self)
	});
	
	this.dirty = false;
}

UrlJson.prototype.update_output = function(slot) {
	return this.object;
}

UrlJson.prototype.state_changed = function(ui) {
	if (this.state.url !== '') {
		if (ui)
			ui.attr('title', this.state.url)

		this.dirty = true
	} else {
		this.object = {}
	}
}

})()
