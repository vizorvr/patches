E2.p = E2.plugins["const_float_generator"] = function(core, node)
{
	this.desc = 'Emits a float constant specified in an input field. If an invalid string in entered, the field is reset to the previous value.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The currently entered value.', def: 1 }
	];
	
	this.state = { val: 1.0 };
};

E2.p.prototype.reset = function()
{
}

E2.p.prototype.create_ui = function()
{
	var inp = $('<input type="text" value="1.0" style="width: 50px;" />');
	
	inp.css('border', '1px solid #999');
	inp.change(function(self) { return function(e) {
		try 
		{ 
			var v = parseFloat(inp.val());
			
			if(!isNaN(v))
				self.state.val = v;
		}
		catch(e) 
		{
		}
		
		// parseFloat has no qualms parsing any string that merely begins
		// with one or more digits, and nothing beyond those will cause a
		// parse exception (e.g., '99A)BOLLCKS' = 99...
		// Here we set the field value to the internal state, so the text
		// field is reset to the correct value, even if parseFloat has
		// no problem with the string.
		inp.val('' + self.state.val);
		
		// Don't set the updated flag directly from an asynchronous function.
		// This could lead to aliasing with the core update logic.
		self.updated = true;
	}}(this));
	
	return inp;
};

E2.p.prototype.update_output = function(slot)
{
	return this.state.val;
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.val);
};
