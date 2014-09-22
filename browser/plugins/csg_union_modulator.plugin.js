E2.p = E2.plugins["csg_union_modulator"] = function(core, node)
{
	this.desc = 'Calculate the union of two CSG objects.';
	
	this.input_slots = [
		{ name: 'A', dt: core.datatypes.OBJECT, desc: 'The first operand object.', def: null },
		{ name: 'B', dt: core.datatypes.OBJECT, desc: 'The second operand object.', def: null }
	];
	
	this.output_slots = [
		{ name: 'csg', dt: core.datatypes.OBJECT, desc: 'The resulting object.' }
	];

	core.add_aux_script('csg/csg.js');

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
		this.csg = this.a.union(this.b);
	else
		this.csg = null;
};

E2.p.prototype.update_output = function(slot)
{
	return this.csg;
};
