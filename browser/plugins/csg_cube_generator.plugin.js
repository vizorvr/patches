E2.p = E2.plugins["csg_cube_generator"] = function(core, node)
{
	this.desc = 'Create a CSG cube object.';
	
	this.input_slots = [
		{ name: 'center', dt: core.datatypes.VECTOR, desc: 'The position of the cube.', def: [0, 0, 0] },
		{ name: 'radius', dt: core.datatypes.FLOAT, desc: 'The size of the cube.', def: 1.0 }
	];
	
	this.output_slots = [
		{ name: 'csg', dt: core.datatypes.OBJECT, desc: 'The resulting object.' }
	];

	this.core = core;
	this.center = [0, 0, 0];
	this.radius = 1.0;
	this.csg = null;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.center = data;
	else
		this.radius = data <= 0.0 ? 1.0 : data;
};

E2.p.prototype.update_state = function()
{
	this.csg = CSG.cube({
		center: this.center,
		radius: this.radius
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
