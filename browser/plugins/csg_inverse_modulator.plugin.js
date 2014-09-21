E2.p = E2.plugins["csg_inverse_modulator"] = function(core, node)
{
	this.desc = 'Calculate the inverse of a CSG object.';
	
	this.input_slots = [
		{ name: 'csg', dt: core.datatypes.OBJECT, desc: 'The object to calculate the inverse of.', def: null }
	];
	
	this.output_slots = [
		{ name: 'csg', dt: core.datatypes.OBJECT, desc: 'The resulting object.' }
	];

	this.core = core;
	this.object = null;
	this.csg = null;
};

E2.p.prototype.is_csg = function(obj)
{
	return obj instanceof CSG;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.object = this.is_csg(data) ? data : null;
};

E2.p.prototype.update_state = function()
{
	this.csg = this.object ? this.object.inverse() : null;
};

E2.p.prototype.update_output = function(slot)
{
	return this.csg;
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
		this.core.add_aux_script('csg/csg.js');
};
