E2.p = E2.plugins["light_clone_modulator"] = function(core, node)
{
	this.desc = 'Makes a physical copy of the input light reference, to allow side-effect free light chain branching.';
	
	this.input_slots = [ 
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'Input light reference.', def: core.renderer.light_default }
	];
	
	this.output_slots = [
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'The cloned light.' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	var l = this.light;
	
	l.type = data.type;
	l.diffuse_color = vec4.create(data.diffuse_color);
	l.specular_color = vec4.create(data.specular_color);
	l.position[0] = data.position[0];
	l.position[1] = data.position[1];
	l.position[2] = data.position[2];
	l.direction[0] = data.direction[0];
	l.direction[1] = data.direction[1];
	l.direction[2] = data.direction[2];
	l.intensity = data.intensity;
};

E2.p.prototype.update_output = function(slot)
{
	return this.light;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.light = new Light();
};
