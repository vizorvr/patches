E2.p = E2.plugins["scene_get_bounding_box"] = function(core, node)
{
	this.desc = 'Extract the <b>min</b> and <b>max</b> AABB vectors from a supplied <b>scene</b> for use in debugging, camera calibration or other calculations.';
	
	this.input_slots = [
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The input scene.', def: null }
	];
	
	this.output_slots = 
	[ 
		{ name: 'min', dt: core.datatypes.VECTOR, desc: 'The lowest <b>scene</b> extent.', def: core.renderer.vector_origin }, 
		{ name: 'max', dt: core.datatypes.VECTOR, desc: 'The highest <b>scene</b> extent.', def: core.renderer.vector_origin } 
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
		var bb = this.scene.bounding_box;
	
		this.lo = bb.lo;
		this.hi = bb.hi;
	}
};

E2.p.prototype.update_output = function(slot)
{
	return (slot.index === 0) ? this.lo : this.hi;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.scene = null;
		this.lo = [0.0, 0.0, 0.0];
		this.hi = [0.0, 0.0, 0.0];
	}
};
