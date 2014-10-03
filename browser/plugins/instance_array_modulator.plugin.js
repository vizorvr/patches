E2.p = E2.plugins["instance_array_modulator"] = function(core, node)
{
	this.desc = 'Create a scene that represents <b>count</b> instances of the supplied <b>mesh</b>, starting at position <b>start</b>, offset by <b>delta</b> each instance.';
	
	this.input_slots = [ 
		{ name: 'count', dt: core.datatypes.FLOAT, desc: 'The number of instances to create.', lo: 0, def: 1 },
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'The mesh to instantiate.', def: null },
		{ name: 'start', dt: core.datatypes.VECTOR, desc: 'The starting position.', def: core.renderer.vector_origin },
		{ name: 'offset', dt: core.datatypes.VECTOR, desc: 'The offset vector.', def: core.renderer.vector_origin }
	];
	
	this.output_slots = [
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'Scene representing <b>count</b> instances.' }
	];

	this.gl = core.renderer.context;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.count = data;
	else if(slot.index === 1)
	{
		var s = this.scene = new Scene(this.gl, null, null);
		
		if(data)
		{
			s.meshes = [data];
			s.vertex_count = data.vertex_count;
		}
	}
	else if(slot.index === 2)
		this.start = data;
	else
		this.offset = data;
};	

E2.p.prototype.update_state = function()
{
	var s = this.scene;

	if(s.meshes.length < 1)
		return;
	
	var m = s.meshes[0];
	var st = this.start;
	var of = this.offset;
	var inst = [];
	var o = st.slice(0);
	
	for(var i = 0; i < this.count; i++)
	{
		var mat = mat4.create();
		
		// TODO: Inline these two ops here for better performance.
		mat4.identity(mat);
		mat4.translate(mat, o);
		inst.push(mat);
		o[0] += of[0];
		o[1] += of[1];
		o[2] += of[2];
	}
	
	m.instances = inst;
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
		this.count = 1;
		this.start = [0, 0, 0];
		this.offset = [0, 0, 0];
	}
};
