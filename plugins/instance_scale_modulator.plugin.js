E2.p = E2.plugins["instance_scale_modulator"] = function(core, node)
{
	this.desc = 'Scale every mesh instance contained in the scene by an amount specified by supplying three delegates. The delegates will be evaluated using the mesh instance index.';
	
	this.input_slots = [ 
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The scene to to scale the instances in.' },
		{ name: 'x-delegate', dt: core.datatypes.DELEGATE, desc: 'The delegate that evaluates to a factor to scale the x-axis given a mesh index.' },
		{ name: 'y-delegate', dt: core.datatypes.DELEGATE, desc: 'The delegate that evaluates to a factor to scale the y-axis given a mesh index.' },
		{ name: 'z-delegate', dt: core.datatypes.DELEGATE, desc: 'The delegate that evaluates to a factor to scale the z-axis given a mesh index.' },
	];
	
	this.output_slots = [
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The modified scene.' }
	];
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input)
	{
		if(slot.index === 0)
			this.scene = null;
		else if(slot.index === 1)
			this.x_delegate = null;
		else if(slot.index === 2)
			this.y_delegate = null;
		else if(slot.index === 3)
			this.z_delegate = null;
	}
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.scene = data;
	else if(slot.index === 1)
		this.x_delegate = data;
	else if(slot.index === 2)
		this.y_delegate = data;
	else if(slot.index === 3)
		this.z_delegate = data;
};	

E2.p.prototype.update_state = function(delta_t)
{
	if(this.scene && (this.x_delegate || this.y_delegate || this.z_delegate))
	{
		var meshes = this.scene.meshes;
		
		for(var i = 0, len = meshes.length; i < len; i++)
		{
			var mesh = meshes[i];
			var d = vec3.create();
			
			if(mesh.instance_transforms)
			{
				var m = mat4.create();
				
				for(var i2 = 0, len2 = mesh.instances.length; i2 < len2; i2++)
				{
					mat4.identity(m);
					
					d[0] = this.x_delegate ? this.x_delegate.delegate(i2) : 1.0;
					d[1] = this.y_delegate ? this.y_delegate.delegate(i2) : 1.0;
					d[2] = this.z_delegate ? this.z_delegate.delegate(i2) : 1.0;
						
					mat4.scale(m, d);
					mat4.multiply(mesh.instance_transforms[i2], m);
				}
			}
		}
	}
};

E2.p.prototype.update_output = function(slot)
{
	return this.scene;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.scene = null;
		this.x_delegate = null;
		this.y_delegate = null;
		this.z_delegate = null;
	}
};
