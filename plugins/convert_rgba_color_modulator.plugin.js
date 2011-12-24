g_Plugins["convert_rgba_color_modulator"] = function(core) {
	var self = this;
	var renderer = core.renderer; 
	var gl = renderer.context;
	
	this.input_slots = [
		 { name: 'R', dt: core.datatypes.FLOAT },
		 { name: 'G', dt: core.datatypes.FLOAT },
		 { name: 'B', dt: core.datatypes.FLOAT },
		 { name: 'A', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR } 
	];
	
	this.state = { color: new Color(1.0, 1.0, 1.0, 1.0) };
	
	this.update_input = function(index, data)
	{
		self.state.color.rgba[index] = data;
	};
	
	this.update_output = function(index)
	{
		return self.state.color;
	};
};
