(function() {

EnvironmentSettingsGenerator = E2.plugins["environment_settings_generator"] = function(core, node)
{
	this.desc = 'Generate environment settings for from_mesh_shader';

	this.input_slots = [
		{ name: 'fog bottom color', dt: core.datatypes.COLOR, desc: 'Fog Color Bottom', def: vec4.createFrom(1, 1, 1, 1) },
		{ name: 'fog bottom height', dt: core.datatypes.FLOAT, desc: 'Fog Bottom Height', def: 0.0 },
		
		{ name: 'fog top color', dt: core.datatypes.COLOR, desc: 'Fog Color Top', def: vec4.createFrom(1, 1, 1, 1) },
		{ name: 'fog top height', dt: core.datatypes.FLOAT, desc: 'Fog Top Height', def: 10.0 },
		
		{ name: 'fog horizontal distance', dt: core.datatypes.FLOAT, desc: 'Fog Distance', def: 10.0 },
		{ name: 'fog horizontal steepness', dt: core.datatypes.FLOAT, desc: 'Fog Steepness', def: 1.0 },

		{ name: 'fog vertical steepness', dt: core.datatypes.FLOAT, desc: 'Fog Vertical Steepness', def: 1.0 } 
	];

	this.output_slots = [
		{ name: 'environment', dt: core.datatypes.ENVIRONMENT, desc: 'Environment Settings' }
	];

	this.output_val = new EnvironmentSettings();
};

EnvironmentSettingsGenerator.prototype.reset = function()
{
	this.fog_bottom_color = vec4.createFrom(1, 1, 1, 1);
	this.fog_bottom_height = 0.0;
	
	this.fog_top_color = vec4.createFrom(1, 1, 1, 1);
	this.fog_top_height = 10.0;
	
	this.fog_horiz_distance = 10.0;	
	this.fog_horiz_steepness = 1.0;

	this.fog_vert_steepness = 1.0;
};

EnvironmentSettingsGenerator.prototype.update_input = function(slot, data)
{
	if(slot.index === 0) { // bottom color
		this.fog_bottom_color = vec4.createFrom(data[0], data[1], data[2], data[3]);
	}
	if(slot.index === 1) { // bottom height
		this.fog_bottom_height = data;
	}
	if(slot.index === 2) { // top color
		this.fog_top_color = vec4.createFrom(data[0], data[1], data[2], data[3]);
	}
	if(slot.index === 3) { // top height
		this.fog_top_height = data;
	}
	else if(slot.index === 4) { // horiz distance
		this.fog_horiz_distance = data;
	}
	else if(slot.index === 5) { // horiz steepness
		this.fog_horiz_steepness = data;
	}
	else if(slot.index === 6) { // vert steepness
		this.fog_vert_steepness = data;
	}
};

EnvironmentSettingsGenerator.prototype.update_state = function()
{
	this.output_val.fog.bottom_color = this.fog_bottom_color;
	this.output_val.fog.bottom_height = this.fog_bottom_height;

	this.output_val.fog.top_color = this.fog_top_color;
	this.output_val.fog.top_height = this.fog_top_height;

	this.output_val.fog.horiz_distance = this.fog_horiz_distance;
	this.output_val.fog.horiz_steepness = this.fog_horiz_steepness;
	
	this.output_val.fog.vert_steepness = this.fog_vert_steepness;
};

EnvironmentSettingsGenerator.prototype.update_output = function(slot)
{
	return this.output_val;
};

})();

