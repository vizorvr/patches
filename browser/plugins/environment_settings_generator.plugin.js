(function() {

EnvironmentSettingsGenerator = E2.plugins["environment_settings_generator"] = function(core, node)
{
	this.desc = 'Generate environment settings for from_mesh_shader';

	this.input_slots = [
		{ name: 'fog color', dt: core.datatypes.COLOR, desc: 'Fog Color', def: vec4.createFrom(1, 1, 1, 1) },
		{ name: 'fog distance', dt: core.datatypes.FLOAT, desc: 'Fog Distance', def: 10.0 },
		{ name: 'fog steepness', dt: core.datatypes.FLOAT, desc: 'Fog Steepness', def: 1.0 }
	];

	this.output_slots = [
		{ name: 'environment', dt: core.datatypes.ENVIRONMENT, desc: 'Environment Settings' }
	];

	this.output_val = new EnvironmentSettings();
};

EnvironmentSettingsGenerator.prototype.reset = function()
{
	this.fog_color = vec4.createFrom(1, 1, 1, 1);
	this.fog_distance = 10.0;	
	this.fog_steepness = 1.0;
};

EnvironmentSettingsGenerator.prototype.update_input = function(slot, data)
{
	if(slot.index === 0) { // color
	  this.fog_color = vec4.createFrom(data[0], data[1], data[2], data[3]);
	}
	else if(slot.index === 1) { // distance
	  this.fog_distance = data;
	}
	else if(slot.index === 2) { // steepness
	  this.fog_steepness = data;
	}
};

EnvironmentSettingsGenerator.prototype.update_state = function()
{
	this.output_val.fog.color = this.fog_color;
	this.output_val.fog.distance = this.fog_distance;
	this.output_val.fog.steepness = this.fog_steepness;
};

EnvironmentSettingsGenerator.prototype.update_output = function(slot)
{
	return this.output_val;
};

})();

