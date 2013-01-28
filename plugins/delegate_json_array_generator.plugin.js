E2.p = E2.plugins["delegate_json_array_generator"] = function(core, node)
{
	this.desc = 'Emit a delegate that can load and expose that values of a JSON array from a given URL. The identifier of the array is expected to be \'<b>data</b>\'.';
	
	this.input_slots = [
		{ name: 'json url', dt: core.datatypes.TEXT, desc: 'The URL of a JSON file containing an array.' } 
	];
	
	this.output_slots = [ 
		{ name: 'delegate', dt: core.datatypes.DELEGATE, desc: 'The resulting delegate.' } 
	];
	
	this.state = {};
	this.data = null;
	this.delegate = new Delegate(function(x) { return 0.0; }, 0, 0);
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
	
	$.ajax({
		url: data,
		dataType: 'json',
		async: false,
		headers: {},
		success: function(self, url) { return function(json) 
		{
			if(json.data)
			{
				self.data = json.data;
				self.delegate = new Delegate(self.delegate_func(self), 0, self.data.length);
			
				msg('0: ' + self.delegate.delegate(0));
				msg('30: ' + self.delegate.delegate(30));
				msg('60: ' + self.delegate.delegate(60));
			}
			else
				msg('ERROR: JSON array delegate: The file \'' + url + '\' did not contain the expected array named \'data\'.');	
		}}(self, data),
		error: function(url) { return function()
		{
			msg('ERROR: JSON array delegate: Couldn\'t load ' + url);
		}}(data)
	});
};

E2.p.prototype.update_output = function(slot)
{
	return this.delegate;
};
