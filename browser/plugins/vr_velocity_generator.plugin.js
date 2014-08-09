E2.p = E2.plugins["vr_velocity_generator"] = function(core, node)
{
	this.desc = 'Supplies linear and angular velocity data from the current VR sensor device.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'linear', dt: core.datatypes.VECTOR, desc: 'The current linear velocity of the sensor.', def: [0.0, 0.0, 0.0] },
		{ name: 'angular', dt: core.datatypes.VECTOR, desc: 'The current angular velocity of the sensor.', def: [0.0, 0.0, 0.0] }
	];
	
	this.renderer = core.renderer;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.update_output = function(slot)
{
	var sensor = this.renderer.vr_sensor;
	
	if(sensor)
	{
		var s = sensor.getState();
		var v = null;
		
		if(slot.index === 0)
			v = s.linearVelocity;
		else
			v = s.angularVelocity;
		
		return [v.x, v.y, v.z];
	}
	
	return [0.0, 0.0, 0.0];
};
