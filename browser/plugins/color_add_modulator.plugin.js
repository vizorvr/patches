E2.p = E2.plugins["color_add_modulator"] = function(core, node)
{
	this.desc = 'Adds a constant value to all components of a color. Each channel is clipped to the range 0;1.';
	
	this.input_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Input color.', def: core.renderer.color_white },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Value to be added to the R, G and B channels.', def: 0.0 } 
	];
	
	this.output_slots = [
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Output color: R+V, G+V, B+V, A' }
	];
};

E2.p.prototype.reset = function()
{
	this.color = vec4.createFrom(1, 1, 1, 1);
	this.output_color = vec4.createFrom(1, 1, 1, 1);
	this.value = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.color = data;
	else
		this.value = data;
};

E2.p.prototype.update_state = function()
{
	var c = this.color;
	var oc = this.output_color;
	var val = this.value;
	
	for(var i = 0; i < 3; i++)
	{
		var v = c[i] + val;
		
		oc[i] = v < 0.0 ? 0.0 : v > 1.0 ? 1.0 : v;
	}
	
	oc[3] = c[4];
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_color;
};
