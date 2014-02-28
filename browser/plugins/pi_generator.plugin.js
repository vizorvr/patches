E2.p = E2.plugins["pi_generator"] = function(core, node)
{
	this.desc = 'Emits the constant ∏ (pi).';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'pi', dt: core.datatypes.FLOAT, desc: 'The constant ∏ (pi).' }
	];
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.update_output = function(slot)
{
	return Math.PI;
};
