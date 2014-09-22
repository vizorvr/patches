E2.p = E2.plugins["csg_inverse_modulator"] = function(core, node)
{
	this.desc = 'Calculate the inverse of a CSG object.';
	
	this.input_slots = [
		{ name: 'csg', dt: core.datatypes.OBJECT, desc: 'The object to calculate the inverse of.', def: null }
	];
	
	this.output_slots = [
		{ name: 'csg', dt: core.datatypes.OBJECT, desc: 'The resulting object.' }
	];

	core.add_aux_script('csg/csg.js');

	this.object = null;
	this.csg = null;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.object = (data instanceof CSG) ? data : null;
};

E2.p.prototype.update_state = function()
{
	this.csg = this.object ? this.object.inverse() : null;
};

E2.p.prototype.update_output = function(slot)
{
	return this.csg;
};
