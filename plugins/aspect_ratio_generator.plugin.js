E2.plugins["aspect_ratio_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits current renderer aspect ratio (width / height).';
	this.input_slots = [];
	this.output_slots = [ { name: 'aspect', dt: core.datatypes.FLOAT, desc: 'The current renderer aspect ratio.' } ];
	
	this.update_output = function(slot)
	{
		var c = core.renderer.canvas;

		return c.width() / c.height();
	};
};
