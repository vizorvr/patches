E2.p = E2.plugins["color_add_modulator"] = function(core, node)
{
	this.desc = 'Adds a constant value to all components of a color. Each channel is clipped to the range 0;1.';
	
	this.input_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Input color.', def: core.renderer.color_white },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Value to be added to the R, G and B channels.', def: 0.0 } 
	];
	
	this.output_slots = [
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Output color: R+V, G+V, B+V' }
	];
};

E2.p.prototype.reset = function()
{
	this.color = new THREE.Color(1, 1, 1)
	this.output_color = new THREE.Color(1, 1, 1)
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
	this.output_color.r = this.color.r + this.value
	this.output_color.g = this.color.g + this.value
	this.output_color.b = this.color.b + this.value
};

E2.p.prototype.update_output = function()
{
	return this.output_color;
};
