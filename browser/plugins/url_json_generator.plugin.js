E2.p = E2.plugins["url_json_generator"] = function(core, node)
{
	this.desc = 'Load JSON as an object from an URL. Hover over the Source button to see the url of the current file.';
	
	this.input_slots = [
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'Use this to load from a URL supplied as a string.' }
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
	var inp = $('<input id="url" type="button" value="Source" title="No JSON selected." />');
	
	inp.click(function(self, inp) { return function(e) 
	{
		var url = self.state.url;
		
		if(url === '')
			url = 'data/';
		
		var diag = make('div');
		var url_inp = $('<input type="input" value="' + url + '" />'); 
		
		url_inp.css({
			'width': '410px',
			'border': '1px solid #999'
		});
		
		diag.append(url_inp);
		
		var done_func = function(self, url_inp, diag, inp) { return function(e)
		{
			self.state.url = url_inp.val();
			self.state.url = self.state.url === 'data/' ? '' : self.state.url;
			self.state_changed(null);
			self.state_changed(inp);
			self.updated = true;

			if(self.state.url === '')
				inp.attr('title', 'No JSON selected.');
		}}(self, url_inp, diag, inp);
		
		var open_func = function(url_inp) { return function()
		{
			url_inp.focus().val(url_inp.val());
		}}(url_inp);
		
		self.core.create_dialog(diag, 'Select JSON URL.', 445, 155, done_func, open_func);
	}}(this, inp));
	
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
