E2.plugins["convert_color_hsla_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Create an RGBA color from hue, saturation and luminosity and alpha.';
	this.input_slots = [
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'The corresponding RGBA color.', def: 'Black' } 
	];
	
	this.output_slots = [ 
		{ name: 'hue', dt: core.datatypes.FLOAT, desc: 'The hue of the input <b>color</b>.', lo: 0, hi: 1, def: 0 },
		{ name: 'saturation', dt: core.datatypes.FLOAT, desc: 'The saturation (color intensity) of the input <b>color</b>.', lo: 0, hi: 1, def: 0 },
		{ name: 'luminosity', dt: core.datatypes.FLOAT, desc: 'The luminosity (brightness) of the input <b>color</b>.', lo: 0, hi: 1, def: 0 },
		{ name: 'alpha', dt: core.datatypes.FLOAT, desc: 'The alpha of the input <b>color</b>.', lo: 0, hi: 1, def: 0 }
	];
	
	this.reset = function()
	{
		self.hsla = [0.0, 0.0, 0.0, 1.0];
		self.color = new Color(0.0, 0.0, 0.0, 1.0);
	};
	
	this.update_input = function(slot, data)
	{
		self.color = data;
	};
	
	this.update_state = function(delta_t)
	{
		var color = self.color.rgba;
		
		self.hsla[0] = self.hsla[1] = self.hsla[2] = 0.0;
		self.hsla[3] = color[3];
		
		var hi = Math.max(Math.max(color[0], color[1]), color[2]);
		var lo = Math.min(Math.min(color[0], color[1]), color[2]);
       	
       		var l = (lo + hi) * 0.5;
       		
       		if(l <= 0.0)
       			return;
       			
       		var diff = hi - lo;
       		var s = diff;
       		
       		if(s > 0.0)
       			s /= (l <= 0.5) ? (lo + hi) : (2.0 - hi - lo);
       		else
       			return;
       		
       		var r = (hi - color[0]) / diff; 
       		var g = (hi - color[1]) / diff; 
       		var b = (hi - color[2]) / diff;
       		var h = 0.0;
       		
       		if(color[0] == hi)
       			h = (color[1] == lo ? 5.0 + b : 1.0 - g);
       		else if(color[1] == hi)
       			h = (color[2] == lo ? 1.0 + r : 3.0 - b);
       		else
       			h = (color[0] == lo ? 3.0 + g : 5.0 - r);
       			
       		self.hsla[0] = h / 6.0;
       		self.hsla[1] = s;
       		self.hsla[2] = l;
       	};
	
	this.update_output = function(slot)
	{
		return self.hsla[slot.index];
	};
};
