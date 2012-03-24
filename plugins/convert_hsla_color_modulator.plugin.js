E2.plugins["convert_hsla_color_modulator"] = function(core, node) {
	var self = this;
	
	this.input_slots = [
		 { name: 'hue', dt: core.datatypes.FLOAT },
		 { name: 'saturation', dt: core.datatypes.FLOAT },
		 { name: 'luminosity', dt: core.datatypes.FLOAT },
		 { name: 'alpha', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR } 
	];
	
	this.reset = function()
	{
		self.hsla = [1.0, 1.0, 1.0, 1.0];
		self.color = new Color(1.0, 1.0, 1.0, 1.0);
	};
	
	this.update_input = function(slot, data)
	{
		self.hsla[slot.index] = data < 0.0 ? 0.0 : data > 1.0 ? 1.0 : data;
	};
	
	this.update_state = function(delta_t)
	{
		var s = self.hsla[1];
		var l = self.hsla[2];
		var sc = self.color.rgba;
		
		sc[3] = self.hsla[3];

		if(s === 0.0)
		{
			sc[0] = sc[1] = sc[2] = l;
			return;
		}
		
		var h = self.hsla[0];
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
       	};
	
	this.update_output = function(slot)
	{
		return self.color;
	};
};
