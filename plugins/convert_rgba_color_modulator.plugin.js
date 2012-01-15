g_Plugins["convert_rgba_color_modulator"] = function(core) {
	var self = this;
	var renderer = core.renderer; 
	var gl = renderer.context;
	
	this.input_slots = [
		 { name: 'red', dt: core.datatypes.FLOAT },
		 { name: 'green', dt: core.datatypes.FLOAT },
		 { name: 'blue', dt: core.datatypes.FLOAT },
		 { name: 'alpha', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR } 
	];
	
	this.reset = function(ui)
	{
		self.color = new Color(1.0, 1.0, 1.0, 1.0);
	};
	
	this.update_input = function(index, data)
	{
		self.color.rgba[index] = data < 0.0 ? 0.0 : data > 1.0 ? 1.0 : data;
	};
	
	this.update_output = function(index)
	{
		return self.color;
	};
};
