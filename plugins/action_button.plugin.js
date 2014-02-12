E2.p = E2.plugins["action_button"] = function(core, node)
{
	this.desc = 'Push button that emits true when it is clicked.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'True once each time the button pis clicked.' }
	];
	
	this.node = node;
};

E2.p.prototype.reset = function()
{
	this.value = true;
	this.next_value = true;
};

E2.p.prototype.create_ui = function()
{
	var inp = $('<input id="state" type="button" value="Click" />');
	
	inp.click(function(self) { return function(e) 
	{
		self.reset();
		self.updated = true;
	}}(this));
	
	return inp;
};

E2.p.prototype.update_state = function()
{
	this.value = this.next_value;
	this.next_value = false;
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
