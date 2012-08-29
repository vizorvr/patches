E2.plugins["instance_cube_modulator"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
		
	this.desc = 'Create a scene that represents \'count\' instances of the supplied \'mesh\', starting at position \'start\', offset by \'delta\' each instance.';
	this.input_slots = [ 
		{ name: 'count', dt: core.datatypes.VERTEX },
		{ name: 'mesh', dt: core.datatypes.MESH },
		{ name: 'start', dt: core.datatypes.VERTEX },
		{ name: 'offset', dt: core.datatypes.VERTEX }
	];
	
	this.output_slots = [ { name: 'scene', dt: core.datatypes.SCENE } ];

	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.count = data;
		else if(slot.index === 1)
		{
			var s = self.scene;
			
			s.meshes = [data];
			s.vertex_count = data.vertex_count;
		}
		else if(slot.index === 2)
			self.start = data;
		else
			self.offset = data;
			
		if(slot.index !== 1)
			self.dirty = true;
	};	

	this.update_state = function(delta_t)
	{
		var s = self.scene;
		
		if(self.dirty)
		{
			var m = s.meshes[0];
			var st = self.start;
			var of = self.offset;
			var inst = [];
			var o = st.slice(0);
			var w = Math.round(self.count[0])
			var h = Math.round(self.count[1])
			var d = Math.round(self.count[2])
			
			for(var x = 0; x < w; x++)
			{
				o[1] = st[1];

				for(var y = 0; y < h; y++)
				{
					o[2] = st[2];
				
					for(var z = 0; z < d; z++)
					{
						var mat = mat4.create();
				
						// TODO: Inline these two ops here for better performance.
						mat4.identity(mat);
						mat4.translate(mat, o);
						inst.push(mat);
						o[2] += of[2];
					}
					
					o[1] += of[1];
				} 

				o[0] += of[0];
			}
			
			m.instances = inst;
			self.dirty = false;
		}
	};	

	this.update_output = function(slot)
	{
		return self.scene;
	};

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.scene = new Scene(gl, null, null);
			self.count = [1, 0, 1];
			self.start = [0, 0, 0];
			self.offset = [0, 0, 0];
			self.dirty = true;
		}
	};
};
