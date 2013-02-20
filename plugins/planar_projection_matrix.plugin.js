E2.p = E2.plugins["planar_projection_matrix"] = function(core, node)
{
	this.desc = 'Create a matrix that represent a planar projection.';
	
	this.input_slots = [
		{ name: 'plane offset', dt: core.datatypes.FLOAT, desc: 'Plane offset from the origin.', def: '0, 0, 0' },
		{ name: 'plane normal', dt: core.datatypes.VECTOR, desc: 'Plane orientation.', def: '0, 0, -1' },
		{ name: 'light pos', dt: core.datatypes.VECTOR, desc: 'Light position in world space.', def: '0, 0, -2' },
	];
	
	this.output_slots = [
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The resulting projection matrix.', def: 'Identity' }
	];
};

E2.p.prototype.reset = function()
{
	this.plane_offset = 0;
	this.plane_normal = [0, 0, -1];
	this.light_pos = [0, 0, -2];
	this.matrix = mat4.create();

	
	mat4.identity(this.matrix);
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.plane_offset = data;
	else if(slot.index === 1)
		this.plane_normal = data;
	else if(slot.index === 1)
		this.light_pos = data;
};	

E2.p.prototype.update_state = function(delta_t)
{
	var n = this.plane_normal;
	var l = this.light_pos;
	var m = this.matrix;
	var d = this.plane_offset;	
	var di = n[0] * l[0] + n[1] * l[1] + n[2] * l[2];

	di = di > 0 ? 1.0 / di : 1.0;
	
// matrix.I.x = 1.0f - n.x * l.x * dotInv;
// matrix.I.y = -n.x * l.y * dotInv;
// matrix.I.z = -n.x * l.z * dotInv;

	m[0] = 1.0 - n[0] * l[0] * di;
	m[4] = -n[0] * l[1] * di;
	m[8] = -n[0] * l[2] * di;
	
// matrix.J.x = -n.y * l.x * dotInv;
// matrix.J.y = 1.0f - n.y * l.y * dotInv;
// matrix.J.z = -n.y * l.z * dotInv;

	m[1] = -n[1] * l[0] * di;
	m[5] = -1.0 - n[1] * l[1] * di;
	m[9] = -n[1] * l[2] * di;

// matrix.K.x = -n.z * l.x * dotInv;
// matrix.K.y = -n.z * l.y * dotInv;
// matrix.K.z = 1.0f - n.z * l.z * dotInv;

	m[2] = -n[2] * l[0] * di;
	m[6] = -n[2] * l[2] * di;
	m[10] = 1.0 - n[2] * l[2] * di;

// matrix.T.x = d * l.x * dotInv;
// matrix.T.y = d * l.y * dotInv;
// matrix.T.z = d * l.z * dotInv; 
	
	m[2] = d * l[0] * di;
	m[6] = d * l[1] * di;
	m[10] = 1.0 - l[2] * di;
};

E2.p.prototype.update_output = function(slot)
{
	return this.matrix;
};
