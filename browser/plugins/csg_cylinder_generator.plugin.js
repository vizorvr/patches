E2.p = E2.plugins["csg_cylinder_generator"] = function(core, node)
{
	this.desc = 'Create a CSG cylinder object.';
	
	this.input_slots = [
		{ name: 'start', dt: core.datatypes.VECTOR, desc: 'The start position of the cylinder.', def: [0, -1, 0] },
		{ name: 'end', dt: core.datatypes.VECTOR, desc: 'The end position of the cylinder.', def: [0, 1, 0] },
		{ name: 'radius', dt: core.datatypes.FLOAT, desc: 'The size of the cylinder.', def: 1.0 },
		{ name: 'slices', dt: core.datatypes.FLOAT, desc: 'The number of slices in the cylinder.', def: 16 }
	];
	
	this.output_slots = [
		{ name: 'csg', dt: core.datatypes.OBJECT, desc: 'The resulting object.' }
	];

	this.core = core;
	this.start = [0, -1, 0];
	this.end = [0, 1, 0];
	this.radius = 1.0;
	this.slices = 16;
	this.csg = null;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.start = data;
	else if(slot.index === 1)
		this.end = data;
	else if(slot.index === 2)
		this.radius = data <= 0.0 ? 1.0 : data;
	else
		this.slices = data < 2 ? 2 : Math.floor(data);
};

E2.p.prototype.update_state = function()
{
	this.csg = CSG.cylinder({
		start: this.start,
		end: this.end,
		radius: this.radius,
		slices: this.slices
	});
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
