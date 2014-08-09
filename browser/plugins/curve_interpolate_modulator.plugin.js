E2.p = E2.plugins["curve_interpolate_modulator"] = function(core, node)
{
	this.desc = 'Interpolates the keypoints of a curve JSON object over time and loops if the bounds of the keypoints are exceeded.';
	
	this.input_slots = [ 
		{ name: 'curve', dt: core.datatypes.OBJECT, desc: 'The curve object to interpolate.', def: null },
		{ name: 'time', dt: core.datatypes.FLOAT, desc: 'The time to use for interpolation.', def: 0.0 } 
	];
	
	this.output_slots = [ 
		{ name: 'position', dt: core.datatypes.VECTOR, desc: 'The interpolated position.', def: [0.0, 0.0, 0.0] }
	];
};

E2.p.prototype.reset = function()
{
	this.curve = null;
	this.time = 0.0;
	this.vector = [0.0, 0.0, 0.0]
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		var bad = 'The supplied curve object is invalid: ';
		
		this.curve = null;
		var props = ['count', 'x', 'y', 'z'];
		
		for(var i = 0; i < props.length; i++)
		{
			if(!data.hasOwnProperty(props[i]))
			{
				msg(bad + 'No "' + props[i] + '" property');
				return;
			}
		}
		
		props = ['x', 'y', 'z'];
		
		for(var i = 0; i < props.length; i++)
		{
			if(Object.prototype.toString.call(data[props[i]]) !== '[object Array]')
			{
				msg(bad + 'The "' + props[i] + '" property is not an array');
				return;
			}
		}
		
		this.curve = data;
	}
	else
		this.time = data;
};	

E2.p.prototype.update_state = function()
{
	if(!this.curve)
	{
		this.x = this.y = this.z = 0.0;
		return;
	}
	
	var l = this.curve.count - 1;
	var i0 = Math.floor(this.time) % l;
	var i1 = (i0 + 1) % l;
	var i2 = (i0 + 2) % l;
	var i3 = (i0 + 3) % l;
	var t = (this.time % l) - i0;
	var it = 1.0 - t;
	var xs = this.curve.x;
	var ys = this.curve.y;
	var zs = this.curve.z;
	
	var d1 = (xs[i2] - xs[i0]) * 0.5;
	var d2 = (xs[i3] - xs[i1]) * 0.5;
	
	this.vector[0] = xs[i1] + (d1 * t) + (((3.0 * (xs[i2] - xs[i1])) - (2.0 * d1) - d2) * t * t) + ((d1 + d2 + (2.0 * (-xs[i2] + xs[i1]))) * t * t * t);
	d1 = (ys[i2] - ys[i0]) * 0.5;
	d2 = (ys[i3] - ys[i1]) * 0.5;
	this.vector[1] = ys[i1] + (d1 * t) + (((3.0 * (ys[i2] - ys[i1])) - (2.0 * d1) - d2) * t * t) + ((d1 + d2 + (2.0 * (-ys[i2] + ys[i1]))) * t * t * t);
	d1 = (zs[i2] - zs[i0]) * 0.5;
	d2 = (zs[i3] - zs[i1]) * 0.5;
	this.vector[2] = zs[i1] + (d1 * t) + (((3.0 * (zs[i2] - zs[i1])) - (2.0 * d1) - d2) * t * t) + ((d1 + d2 + (2.0 * (-zs[i2] + zs[i1]))) * t * t * t);
};

E2.p.prototype.update_output = function(slot)
{
	return this.vector;
};

