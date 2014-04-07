E2.p = E2.plugins["instance_clear_transform_modulator"] = function(core, node)
{
	this.desc = 'Clear or add user transforms to every instance in the supplied scene. This plugin must be applied before any subsequent transformation of instanced scenes.';
	
	this.input_slots = [ 
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The scene to to clear the transform of instances in.', def: null },
		{ name: 'driver', dt: core.datatypes.FLOAT, desc: 'Since the instancing plugins do not regenerate the scene every frame, this plugin needs to be driven by another plugin delivering continous output, like a Clock. If the driver slot is not connected to a plugin delivering continous output, subsequent transforms will effectively be accumulative.' }
	];
	
	this.output_slots = [
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The modified scene.' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.scene = data;
};	

E2.p.prototype.update_state = function()
{
	if(this.scene)
	{
		var meshes = this.scene.meshes;
		
		for(var i = 0, len = meshes.length; i < len; i++)
		{
			var mesh = meshes[i];

			if(mesh.instance_transforms)
			{
				for(var i2 = 0, len2 = mesh.instances.length; i2 < len2; i2++)
					mat4.identity(mesh.instance_transforms[i2]);
			}
			else
			{
				mesh.instance_transforms = [];
			
				for(var i2 = 0, len2 = mesh.instances.length; i2 < len2; i2++)
				{
					var m = mat4.create();

					mat4.identity(m);
					mesh.instance_transforms.push(m);
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
		this.scene = null;
};
