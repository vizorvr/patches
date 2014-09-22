E2.p = E2.plugins["csg_sphere_generator"] = function(core, node)
{
	this.desc = 'Create a CSG sphere object.';
	
	this.input_slots = [
		{ name: 'center', dt: core.datatypes.VECTOR, desc: 'The position of the sphere.', def: [0, 0, 0] },
		{ name: 'radius', dt: core.datatypes.FLOAT, desc: 'The size of the sphere.', def: 1.0 },
		{ name: 'slices', dt: core.datatypes.FLOAT, desc: 'The number of slices in the sphere.', def: 16 },
		{ name: 'stacks', dt: core.datatypes.FLOAT, desc: 'The number of stacks in the sphere.', def: 8 }
	];
	
	this.output_slots = [
		{ name: 'csg', dt: core.datatypes.OBJECT, desc: 'The resulting object.' }
	];

	core.add_aux_script('csg/csg.js');

	this.center = [0, 0, 0];
	this.radius = 1.0;
	this.slices = 16;
	this.stacks = 8;
	this.csg = null;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.center = data;
	else if(slot.index === 1)
		this.radius = data <= 0.0 ? 1.0 : data;
	else if(slot.index === 2)
		this.slices = data < 2 ? 2 : Math.floor(data);
	else
		this.stacks = data < 2 ? 2 : Math.floor(data);
};

E2.p.prototype.update_state = function()
{
	this.csg = CSG.sphere({
		center: this.center,
		radius: this.radius,
		slices: this.slices,
		stacks: this.stacks
	});
};

E2.p.prototype.update_output = function(slot)
{
	return this.csg;
};
