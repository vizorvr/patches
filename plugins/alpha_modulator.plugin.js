E2.plugins["alpha_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Changes the alpha component of the<br>supplied color to the supplied alpha.';
	this.input_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR },
		{ name: 'alpha', dt: core.datatypes.FLOAT } 
	];
	
	this.output_slots = [ { name: 'color', dt: core.datatypes.COLOR } ];
	
	this.reset = function()
	{
		self.color = new Color(1, 1, 1);
	};
	
	this.update_input = function(slot, data)
	{
		var rgba = self.color.rgba;
		
		if(slot.index === 0)
		{
			rgba[0] = data.rgba[0];
			rgba[1] = data.rgba[1];
			rgba[2] = data.rgba[2];
		
		}
		else
			rgba[3] = data;
	};	
	
	this.update_output = function(slot)
	{
		return self.color;
	};	
};
