E2.p = E2.plugins["convert_hsl_color_modulator"] = function(core, node)
{
	this.desc = 'Create an RGB color from hue, saturation and luminosity.';
	
	this.input_slots = [
		 { name: 'hue', dt: core.datatypes.FLOAT, desc: 'The hue of the output color.', lo: 0, hi: 1, def: 1.0 },
		 { name: 'saturation', dt: core.datatypes.FLOAT, desc: 'The saturation (color intensity) of the output color.', lo: 0, hi: 1, def: 1.0 },
		 { name: 'luminosity', dt: core.datatypes.FLOAT, desc: 'The luminosity (brightness) of the output color.', lo: 0, hi: 1, def: 1.0 }
	];
	
	this.output_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'The corresponding RGB color.', def: core.renderer.color_white } 
	];
};

E2.p.prototype.reset = function()
{
	this.hsl = [1, 1, 1];
	this.color = new THREE.Color(1,1,1)
};

E2.p.prototype.update_input = function(slot, data)
{
	this.hsl[slot.index] = data < 0.0 ? 0.0 : data > 1.0 ? 1.0 : data;
};

E2.p.prototype.update_state = function()
{
	var s = this.hsl[1];
	var l = this.hsl[2];
	var sc = [];
	
	if(s === 0.0) {
		sc[0] = sc[1] = sc[2] = l;
		return;
	}
	
	var h = this.hsl[0];
	var t2 = ((l <= 0.5) ? l * (1.0 + s) : l + s - (l * s));
	var t1 = 2.0 * l - t2;		
	var t3 = [h + 1.0 / 3.0, h, h - 1.0 / 3.0];
	
	for(var i = 0; i < 3; i++)
	{
		if(t3[i] < 0.0)
			t3[i] += 1.0;
		if(t3[i] > 1.0)
			t3[i] -= 1.0;
		
		var t3v = t3[i];
					
		if(6.0 * t3v < 1.0)
			sc[i] = t1 + (t2-t1) * t3v * 6.0;
		else if(2.0 * t3v < 1.0)
			sc[i] = t2;
		else if(3.0 * t3v < 2.0)
			sc[i] = (t1 + (t2 - t1) * ((2.0 / 3.0) - t3v) * 6.0);
		else
			sc[i] = t1;
	}

	this.color.setRGB(sc[0], sc[1], sc[2])
};

E2.p.prototype.update_output = function()
{
	return this.color;
};
