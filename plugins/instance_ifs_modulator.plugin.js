E2.plugins["instance_ifs_modulator"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
		
	this.desc = 'Create a scene that represents <b>count</b> instances of the supplied <b>mesh</b>, starting at position <b>start</b>, offset by <b>delta</b> each instance.';
	this.input_slots = [ 
		{ name: 'recursion depth', dt: core.datatypes.FLOAT, desc: 'Level to resurse to.', lo: 1, hi: 6, def: 1 },
		{ name: 'level resolution', dt: core.datatypes.FLOAT, desc: 'Number of instances per recursion level.', lo: 1, hi: 4, def: 1 },
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'The mesh to instantiate.' },
		{ name: 'level transform', dt: core.datatypes.TRANSFORM, desc: 'Transform applied between branches.', def: 'Identity' },
		{ name: 'branch transform', dt: core.datatypes.TRANSFORM, desc: 'Transform applied between instances on the same level.', def: 'Identity' }
	];
	
	this.output_slots = [ { name: 'scene', dt: core.datatypes.SCENE, desc: 'Scene representing the resulting IFS.' } ];

	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.r_depth = data;
		if(slot.index === 1)
			self.l_res = data;
		else if(slot.index === 2)
		{
			var s = self.scene;
			
			if(s.meshes[0]) // Copy old instance list to new mesh instead of generating it.
				data.instances = s.meshes[0].instances;
			
			s.meshes = [data];
			s.vertex_count = data.vertex_count;
		}
		else if(slot.index === 3)
			self.l_transform = data;
		else if(slot.index === 4)
			self.b_transform = data;
			
		if(slot.index !== 2)
			self.dirty = true;
	};	

	this.update_state = function(delta_t)
	{
		var s = self.scene;
		
		if(self.dirty)
		{
			var m = s.meshes[0];
			var r_gen = function(inst, t, level)
			{
				if(level === self.r_depth)
					return;
				
				for(var i = 0; i < self.l_res; i++)
				{
					inst.push(mat4.create(t));
					mat4.multiply(t, self.b_transform);
				}
				
				mat4.multiply(t, self.l_transform);
				r_gen(inst, t, level + 1);
			};
						
			var inst = [];
			var bm = mat4.create();
			
			mat4.identity(bm);
			r_gen(inst, bm, 0);
			m.instances = inst;
			self.dirty = false;
		}
	};	

	this.update_output = function(slot)
	{
		return self.scene;
	};

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.scene = new Scene(gl, null, null);
			self.r_depth = 1;
			self.l_res = 1;
			self.l_transform = mat4.create();
			self.b_transform = mat4.create();
			self.dirty = false;
			
			mat4.identity(self.l_transform);
			mat4.identity(self.b_transform);
		}
	};
};
