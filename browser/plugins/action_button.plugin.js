E2.p = E2.plugins["action_button"] = function(core, node)
{
	this.desc = 'Push button that emits true when it is clicked.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'True once each time the button is clicked.' }
	];
	
	this.node = node;
};

E2.p.prototype.reset = function()
{
	this.value = false;
	this.output_value = false;
};

E2.p.prototype.create_ui = function()
{
	var inp = makeButton('Click', null, 'e_btn');
	
	inp.click(function(self) { return function(e) 
	{
		self.output_value = false;
		self.value = true;
		self.updated = true;
	}}(this));
	
	return inp;
};

E2.p.prototype.update_state = function()
{
	this.output_value = this.value;
	this.value = false;
	this.updated = true;
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_value;
};
