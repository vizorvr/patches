E2.p = E2.plugins["instance_ifs_modulator"] = function(core, node)
{
	this.desc = 'Create a scene that represents <b>count</b> instances of the supplied <b>mesh</b>, starting at position <b>start</b>, offset by <b>delta</b> each instance.';
	
	this.input_slots = [ 
		{ name: 'recursion depth', dt: core.datatypes.FLOAT, desc: 'Level to resurse to.', lo: 1, hi: 6, def: 1 },
		{ name: 'level resolution', dt: core.datatypes.FLOAT, desc: 'Number of instances per recursion level.', lo: 1, hi: 4, def: 1 },
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'The mesh to instantiate.', def: null },
		{ name: 'level transform', dt: core.datatypes.MATRIX, desc: 'Transform applied between branches.', def: core.renderer.matrix_identity },
		{ name: 'branch transform', dt: core.datatypes.MATRIX, desc: 'Transform applied between instances on the same level.', def: core.renderer.matrix_identity }
	];
	
	this.output_slots = [
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'Scene representing the resulting IFS.' }
	];

	this.gl = core.renderer.context;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.r_depth = data;
	if(slot.index === 1)
		this.l_res = data;
	else if(slot.index === 2)
	{
		var s = this.scene = new Scene(this.gl, null, null);
		
		if(data)
		{
			s.meshes = [data];
			s.vertex_count = data.vertex_count;
		}
	}
	else if(slot.index === 3)
		this.l_transform = data;
	else if(slot.index === 4)
		this.b_transform = data;
};	

E2.p.prototype.update_state = function()
{
	var s = this.scene;
	
	if(s.meshes.length < 1)
		return;
	
	var m = s.meshes[0];
	var r_gen = function(self, inst, t, level)
	{
		if(level === self.r_depth)
			return;
		
		for(var i = 0; i < self.l_res; i++)
		{
			inst.push(mat4.create(t));
			mat4.multiply(t, self.b_transform);
		}
		
		mat4.multiply(t, self.l_transform);
		r_gen(self, inst, t, level + 1);
	};
				
	var inst = [];
	var bm = mat4.create();
	
	mat4.identity(bm);
	r_gen(this, inst, bm, 0);
	m.instances = inst;
	m.instance_transforms = null;
};	

E2.p.prototype.update_output = function(slot)
{
	return this.scene;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.scene = new Scene(this.gl, null, null);
		this.r_depth = 1;
		this.l_res = 1;
		this.l_transform = mat4.create();
		this.b_transform = mat4.create();
		
		mat4.identity(this.l_transform);
		mat4.identity(this.b_transform);
	}
};
