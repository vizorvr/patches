E2.p = E2.plugins["delegate_json_array_generator"] = function(core, node)
{
	this.desc = 'Emit a float delegate that can load and expose the (float) values of a JSON array from a given URL. The identifier of the array is expected to be \'<b>data</b>\'.';
	
	this.input_slots = [
		{ name: 'json url', dt: core.datatypes.TEXT, desc: 'The URL of a JSON file containing an array.' } 
	];
	
	this.output_slots = [ 
		{ name: 'delegate', dt: core.datatypes.DELEGATE, desc: 'The resulting float delegate.' } 
	];
	
	this.state = {};
	this.core = core;
	this.data = null;
	this.delegate = new Delegate(function(x) { return 0.0; }, core.datatypes.FLOAT, 0);
	this.url = '';
};

E2.p.prototype.delegate_func = function(self) { return function(x)
{
	var i = Math.floor(x);
	
	return (self.data && i > -1 && i < self.data.length) ? self.data[i] : 0.0;
}};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.update_input = function(slot, data)
{
	if(this.url === data)
		return;
	
	var self = this;
	
	msg('JSON array delegate: Loading : ' + data);
	this.url = data;
	this.core.asset_tracker.signal_started();
	
	$.ajax({
		url: data,
		dataType: 'json',
		async: false,
		headers: {},
		success: function(self, url, c) { return function(json) 
		{
			if(json.data)
			{
				self.data = json.data;
				self.delegate = new Delegate(self.delegate_func(self), c.datatypes.FLOAT, self.data.length);
				c.asset_tracker.signal_completed();
			}
			else
			{
				msg('ERROR: JSON array delegate: The file \'' + url + '\' did not contain the expected array named \'data\'.');	
				c.asset_tracker.signal_failed();
			}
		}}(self, data, this.core),
		error: function(url, c) { return function()
		{
			msg('ERROR: JSON array delegate: Couldn\'t load ' + url);
			c.asset_tracker.signal_failed();
		}}(data, this.core)
	});
};

E2.p.prototype.update_output = function(slot)
{
	return this.delegate;
};
