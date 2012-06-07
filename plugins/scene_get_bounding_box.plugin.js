E2.plugins["scene_get_bounding_box"] = function(core, node) {
	var self = this;
	
	this.desc = 'Extract the min / max AABB vectors from a supplied scene for use in debugging, camera calibration or other calculations.';
	this.input_slots = [ { name: 'scene', dt: core.datatypes.SCENE } ];
	this.output_slots = 
	[ 
		{ name: 'min', dt: core.datatypes.VERTEX }, 
		{ name: 'max', dt: core.datatypes.VERTEX } 
	];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.scene = data;
	};	

	this.update_state = function(delta_t)
	{
		var bb = self.scene.bounding_box;
		
		self.lo = bb.lo;
		self.hi = bb.hi;
	};
	
	this.update_output = function(slot)
	{
		return (slot.index === 0) ? self.lo : self.hi;
	};	

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.scene = null;
			self.lo = [0.0, 0.0, 0.0];
			self.hi = [0.0, 0.0, 0.0];
		}
	};
};
