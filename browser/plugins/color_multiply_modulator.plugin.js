E2.p = E2.plugins["color_multiply_modulator"] = function(core, node)
{
	this.desc = 'Scale the RGB components of a color by a supplied factor.';
	
	this.input_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Color to be modulated.', def: core.renderer.color_white },
		{ name: 'factor', dt: core.datatypes.FLOAT, desc: 'Factor to scale the RGB components of the supplied color with.', def: 1.0 } 
	];
	
	this.output_slots = [
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Output color: R * V, G * V, B * V, A' }
	];
};

E2.p.prototype.reset = function() {
	this.color = new THREE.Color(1, 1, 1)
	this.output_color = new THREE.Color(1, 1, 1)
	this.factor = 1.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.color = data;
	else
		this.factor = data;
};

E2.p.prototype.update_state = function()
{
	var c = this.color;
	var oc = this.output_color;
	var f = this.factor;
	
	var r = c.r * f;
	var g = c.g * f;
	var b = c.b * f;

	oc.r = r < 0.0 ? 0.0 : r > 1.0 ? 1.0 : r;
	oc.g = g < 0.0 ? 0.0 : g > 1.0 ? 1.0 : g;
	oc.b = b < 0.0 ? 0.0 : b > 1.0 ? 1.0 : b;
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_color;
};
