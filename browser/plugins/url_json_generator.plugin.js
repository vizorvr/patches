var URL_JSON_ROOT = 'data/jsons/';

E2.p = E2.plugins["url_json_generator"] = function(core, node)
{
	this.desc = 'Load JSON as an object from an URL. Hover over the Source button to see the url of the current file.';
	
	this.input_slots = [
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'Use this to load from a URL supplied as a string.', def: URL_JSON_ROOT }
	];
	
	this.output_slots = [
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'The object if one has been selected.' }
	];
	
	this.state = { url: '' };
	this.core = core;
	this.object = {};
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var inp = makeButton('Source', 'No JSON selected.', 'url');
	var self = this;

	inp.click(function()
	{
		FileSelectControl
			.createForUrl(URL_JSON_ROOT, self.state.url)
			.onChange(function(v)
			{
				if (v.indexOf('://') === -1)
					v = URL_JSON_ROOT + v
				self.state.url = v;
				self.state_changed(null);
				self.state_changed(inp);
				self.updated = true;
			});
	});

	return inp;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.state.url = data;
	this.state_changed(null);
};

E2.p.prototype.update_output = function(slot)
{
	return this.object;
};

E2.p.prototype.state_changed = function(ui)
{
	if(this.state.url !== '')
	{
		if(ui)
			ui.attr('title', this.state.url);
		else
		{
			var self = this;
			
			self.core.asset_tracker.signal_started();
	
			jQuery.ajax({
				url: self.state.url, 
				dataType: 'json',
				success: function(self) { return function(data) 
				{
					self.object = data;
					self.core.asset_tracker.signal_completed();
				}}(self),
				error: function(self) { return function(jqXHR, textStatus, errorThrown)
				{
					msg('ERROR: Failed to load JSON "' + self.state.url + '": ' + textStatus + ', ' + errorThrown);
					self.state.url = '';
					self.object = {}
					self.core.asset_tracker.signal_failed();
				}}(self),
				async: false
			});
		}
	}
};
