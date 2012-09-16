E2.plugins["pi_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits the constant ∏ (pi).';
	this.input_slots = [];
	this.output_slots = [ { name: 'pi', dt: core.datatypes.FLOAT, desc: 'The constant ∏ (pi).' } ];
	
	this.update_output = function(slot)
	{
		return Math.PI;
	};	
};
