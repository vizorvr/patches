E2.p = E2.plugins["csg_difference_modulator"] = function(core, node)
{
	this.desc = 'Calculate the difference of two CSG objects.';
	
	this.input_slots = [
		{ name: 'A', dt: core.datatypes.OBJECT, desc: 'The first operand object.', def: null },
		{ name: 'B', dt: core.datatypes.OBJECT, desc: 'The second operand object.', def: null }
	];
	
	this.output_slots = [
		{ name: 'csg', dt: core.datatypes.OBJECT, desc: 'The resulting object.' }
	];

	this.core = core;
	this.a = null;
	this.b = null;
	this.csg = null;
};

E2.p.prototype.is_csg = function(obj)
{
	return obj instanceof CSG;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.a = this.is_csg(data) ? data : null;
	else
		this.b = this.is_csg(data) ? data : null;
};

E2.p.prototype.update_state = function()
{
	if(this.a && this.b)
		this.csg = this.a.subtract(this.b);
	else
		this.csg = null;
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
