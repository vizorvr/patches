E2.p = E2.plugins["convert_vector_xyz_modulator"] = function(core, node)
{
	this.desc = 'Decompose a vector to its individual XYZ components so they can be manipulated individually.';
	
	this.input_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Input vector.', def: new THREE.Vector3() }
	];
	
	this.output_slots = [
		 { name: 'x', dt: core.datatypes.FLOAT, desc: 'The x-component.', def: 0.0 },
		 { name: 'y', dt: core.datatypes.FLOAT, desc: 'The y-component.', def: 0.0 },
		 { name: 'z', dt: core.datatypes.FLOAT, desc: 'The z-component.', def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.value = new THREE.Vector3();
};

E2.p.prototype.update_input = function(slot, data)
{
	this.value = data;
};

E2.p.prototype.update_output = function(slot)
{
	if (slot.index === 0) {
		return this.value.x
	}
	else if (slot.index === 1) {
		return this.value.y
	}
	else {
		return this.value.z
	}
};
