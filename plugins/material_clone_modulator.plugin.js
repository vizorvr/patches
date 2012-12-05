E2.p = E2.plugins["material_clone_modulator"] = function(core, node)
{
	this.desc = 'Makes a physical copy of the input material reference, to allow side-effect free material chain branching.';
	
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material reference.' }
	];
	
	this.output_slots = [
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'The cloned material.' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	var m = this.material;

	m.t_cache = data.t_cache;
	m.depth_test = data.depth_test;
	m.depth_write = data.depth_write;
	m.depth_func = data.depth_func;
	m.alpha_clip = data.alpha_clip;
	m.shinyness = data.shinyness;
	m.double_sided = data.double_sided;
	m.blend_mode = data.blend_mode;
	m.ambient_color.clone(data.ambient_color);
	m.diffuse_color.clone(data.diffuse_color);
	m.textures = data.textures.slice(0);
	m.lights = data.lights.slice(0);
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input)
		this.material = new Material();
};

E2.p.prototype.update_output = function(slot)
{
	return this.material;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.material = new Material();
};
