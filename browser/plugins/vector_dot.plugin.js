E2.p = E2.plugins["vector_dot"] = function(core, node)
{
	this.desc = 'Emits the dot products of the two supplied vectors.';
	
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The first operand.', def: core.renderer.vector_origin }, 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The second operand.', def: core.renderer.vector_origin } 
	];
	
	this.output_slots = [
		{ name: 'float', dt: core.datatypes.FLOAT, desc: 'Emits F dot S.', def: 0.0 }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.vector_a = data;
	else if(slot.index === 1)
		this.vector_b = data;
};	

E2.p.prototype.update_state = function()
{
	this.result = vec3.dot(this.vector_a, this.vector_b);
};

E2.p.prototype.update_output = function(slot)
{
	return this.result;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.vector_a = [0, 0, 0];
		this.vector_b = [0, 0, 0];
		this.result = 0.0;
	}
};
