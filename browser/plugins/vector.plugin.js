E2.p = E2.plugins["vector"] = function(core, node)
{
	this.desc = 'Create a vector from individual X, Y and Z components.';
	
	this.input_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'The input x-component.', def: 0.0 },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: 'The input y-component.', def: 0.0 },
		{ name: 'z', dt: core.datatypes.FLOAT, desc: 'The input z-component.', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The resulting vector.', def: core.renderer.vector_origin }
	];	
};

E2.p.prototype.update_input = function(slot, data)
{
	this.xyz[slot.index] = data;
};	

E2.p.prototype.update_output = function(slot)
{
	return this.xyz;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.xyz = [0.0, 0.0, 0.0];
};
