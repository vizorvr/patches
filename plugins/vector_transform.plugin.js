E2.plugins["vector_transform"] = function(core, node) {
	var self = this;
	
	this.desc = 'Transform a vector by the supplied matrix.';
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Input vector to transform.', def: '0, 0, 0' },
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'Transformation matrix to multiply the vector by.', def: 'Identity' } 
	];
	
	this.output_slots = [ { name: 'vector', dt: core.datatypes.VECTOR, desc: 'Emits the transformed input vector.', def: '0, 0, 0' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.vector = data;
		else if(slot.index === 1)
			self.matrix = data;
	};	

	this.update_state = function(delta_t)
	{
		mat4.multiplyVec3(self.matrix, self.vector, self.transformed);
	};
	
	this.update_output = function(slot)
	{
		return self.transformed;
	};	

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.vector = [0, 0, 0];
			self.transformed = [0, 0, 0];
			self.matrix = mat4.create();
			
			mat4.identity(self.matrix);
		}
	};
};
