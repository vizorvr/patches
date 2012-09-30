E2.plugins["vector_add"] = function(core, node) {
	var self = this;
	
	this.desc = 'Adds the X, Y and Z components of the supplied vectors and emits the result.';
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The first operand.', def: '0, 0, 0' }, 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The second operand.', def: '0, 0, 0' } 
	];
	
	this.output_slots = [ { name: 'vector', dt: core.datatypes.VECTOR, desc: 'Emits Fx + Sx, Fy + Sy, Fz + Sz.', def: '0, 0, 0' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.vector_a = data;
		else if(slot.index === 1)
			self.vector_b = data;
	};	

	this.update_state = function(delta_t)
	{
		var r = self.result, va = self.vector_a, vb = self.vector_a;
		
		r[0] = va[0] + vb[0];
		r[1] = va[1] + vb[1];
		r[2] = va[2] + vb[2];
	};
	
	this.update_output = function(slot)
	{
		return self.result;
	};	

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.vector_a = [0, 0, 0];
			self.vector_b = [0, 0, 0];
			self.result = [0, 0, 0];
		}
	};
};
