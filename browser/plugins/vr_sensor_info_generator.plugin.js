E2.p = E2.plugins["vr_sensor_info_generator"] = function(core, node)
{
	this.desc = 'Supplies the position and orientation of the current VR HMD.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'position', dt: core.datatypes.VECTOR, desc: 'The position of the current HMD device.' },
		{ name: 'orientation', dt: core.datatypes.MATRIX, desc: 'The orientation of the current HMD device.' }
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
	
	this.updated = true;

	if(slot.index === 0)
	{
		if(sensor)
		{
			var p = sensor.getState().position;
			
			return [p.x, p.y, p.z];
		}
		else
		{
			return [0.0, 0.0, 0.0];
		}

	}
	
	if(sensor)
	{
		var o = sensor.getState().orientation;
		var q = quat4.createFrom(o.x, o.y, o.z, o.w);
		
		return quat4.toMat4(q);
	}
	
	var m = mat4.create();
	
	mat4.identity(m);
	return m;
};