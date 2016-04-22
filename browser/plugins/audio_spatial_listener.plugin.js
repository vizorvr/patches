(function() {

var SpatialListener = E2.plugins.audio_spatial_listener = function(core, node) 
{
	this.desc = 'Spatial Listener.';
	
	this.input_slots = [ 
		{ name: 'position', dt: core.datatypes.VECTOR, desc: 'Position.', def: core.renderer.vector_origin },
		{ name: 'forward', dt: core.datatypes.VECTOR, desc: 'Forward Vector.', def: core.renderer.vector_origin },
		{ name: 'up', dt: core.datatypes.VECTOR, desc: 'Up Vector.', def: core.renderer.vector_origin }
	];
	
	this.output_slots = [];
	
	this.position = null;
	this.forward = null;
	this.up = null;

	this.prev_position = new THREE.Vector3();
	this.prev_forward = new THREE.Vector3();
	this.prev_up = new THREE.Vector3();

	this.audioContext = core.audioContext;
	this.first = true;
}

SpatialListener.prototype.reset = function()
{
	this.first = true;
}

SpatialListener.prototype.update_input = function(slot, data)
{
	switch( slot.index ) 
	{
		case 0: this.position = data;	break;
		case 1:	this.forward = data;	break;
		case 2:	this.up = data;			break;
	}
}

SpatialListener.update_state = function(uc)
{
	function ramp(param,v0,v1,t)
	{
		if( v0 != v1 )
			param.linearRampToValue(v0,t);
	}

	var t = this.audioContext.currentTime + this.first ? 0 : uc.delta_t;
	var listener = this.audioContext.listener;

	if( this.position !== null ) 
	{
		ramp( listener.positionX, this.position.x, this.prev_position.x, t );
		ramp( listener.positionY, this.position.y, this.prev_position.y, t );
		ramp( listener.positionZ, this.position.z, this.prev_position.z, t );
	}

	if( this.forward !== null ) 
	{
		ramp( listener.forwardX, this.forward.x, this.prev_forward.x, t );
		ramp( listener.forwardY, this.forward.y, this.prev_forward.y, t );
		ramp( listener.forwardZ, this.forward.z, this.prev_forward.z, t );
	}	

	if( this.up !== null ) 
	{
		ramp( listener.upX, this.up.x, this.prev_up.x, t );
		ramp( listener.upY, this.up.y, this.prev_up.y, t );
		ramp( listener.upZ, this.up.z, this.prev_up.z, t );
	}	

	this.prev_position.copy( this.position );
	this.prev_forward.copy( this.forward );
	this.prev_up.copy( this.up );

	this.first = false;
}

/*SpatialListener.update_output = function(slot)
{
	return this.audionode;
}*/

})();
