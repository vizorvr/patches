E2.p = E2.plugins["convert_color_hsl_modulator"] = function(core, node)
{
	this.desc = 'Create an RGB color from hue, saturation and luminosity.';
	
	this.input_slots = [
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'The corresponding RGBA color.', def: core.renderer.color_black } 
	];
	
	this.output_slots = [ 
		{ name: 'hue', dt: core.datatypes.FLOAT, desc: 'The hue of the input <b>color</b>.', lo: 0, hi: 1, def: 0.0 },
		{ name: 'saturation', dt: core.datatypes.FLOAT, desc: 'The saturation (color intensity) of the input <b>color</b>.', lo: 0, hi: 1, def: 0.0 },
		{ name: 'luminosity', dt: core.datatypes.FLOAT, desc: 'The luminosity (brightness) of the input <b>color</b>.', lo: 0, hi: 1, def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.hsl = [1, 1, 1, 1];
	this.color = new THREE.Color(1,1,1)
};

E2.p.prototype.update_input = function(slot, data)
{
	this.color = data;
};

E2.p.prototype.update_state = function()
{
	var color = this.color;
	
	this.hsl[0] = this.hsl[1] = this.hsl[2] = 0.0;
	
	var hi = Math.max(Math.max(color.r, color.g), color.b);
	var lo = Math.min(Math.min(color.r, color.g), color.b);

	var l = (lo + hi) * 0.5;
	
	if(l <= 0.0)
		return;
		
	var diff = hi - lo;
	var s = diff;
	
	this.hsl[2] = l;

	if(s > 0.0)
		s /= (l <= 0.5) ? (lo + hi) : (2.0 - hi - lo);
	else
		return;
	
	var r = (hi - color.r) / diff; 
	var g = (hi - color.g) / diff; 
	var b = (hi - color.b) / diff;
	var h = 0.0;
	
	if(color.r === hi)
		h = (color.g === lo ? 5.0 + b : 1.0 - g);
	else if(color.g === hi)
		h = (color.b === lo ? 1.0 + r : 3.0 - b);
	else
		h = (color.r === lo ? 3.0 + g : 5.0 - r);
		
	this.hsl[0] = h / 6.0;
	this.hsl[1] = s;
};

E2.p.prototype.update_output = function(slot)
{
	return this.hsl[slot.index];
};
