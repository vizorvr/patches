E2.p = E2.plugins["vr_acceleration_generator"] = function(core, node)
{
	this.desc = 'Supplies linear and angular acceleration data from the current VR sensor device.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'linear', dt: core.datatypes.VECTOR, desc: 'The current linear acceleration of the sensor.', def: [0.0, 0.0, 0.0] },
		{ name: 'angular', dt: core.datatypes.VECTOR, desc: 'The current angular acceleration of the sensor.', def: [0.0, 0.0, 0.0] }
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
		var a = null;
		
		if(slot.index === 0)
			a = s.linearAcceleration;
		else
			a = s.angularAcceleration;
		
		return [a.x, a.y, a.z];
	}
	
	return [0.0, 0.0, 0.0];
};
