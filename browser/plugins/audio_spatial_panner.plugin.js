(function() {

var SpatialPanner = E2.plugins.audio_spatial_panner = function(core, node) 
{
	this.desc = 'Spatial Panner.';
	
	this.input_slots = [ 
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'An audio source to spatialize.', def: null },
		{ name: 'position', dt: core.datatypes.VECTOR, desc: 'Position.', def: core.renderer.vector_origin }
	];
	
	this.output_slots = [
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'A spatialized audio source', def: null }
	];
	
	this.panner = core.audioContext ? core.audioContext.createPanner() : null;
	this.src = null;
	this.position = null;
	this.prev_position = new THREE.Vector3();

	this.first = true;
}

SpatialPanner.prototype.reset = function()
{
	this.first = true;
}

SpatialPanner.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		if(this.src && this.src.disconnect)
			this.src.disconnect(0);
		
		if(this.src = data)
		{
			data.connect(this.audionode);
			this.panner.player = data.player;
		}		
	}
	else
	{
		this.position = data;
	}
}

SpatialPanner.update_state = function(uc)
{
	function ramp(param,v0,v1,t)
	{
		if( v0 != v1 )
			param.linearRampToValue(v0,t);
	}

	var t = this.audioContext.currentTime + this.first ? 0 : uc.delta_t;

	if( this.position !== null ) 
	{
		ramp( this.panner.positionX, this.position.x, this.prev_position.x, t );
		ramp( this.panner.positionY, this.position.y, this.prev_position.y, t );
		ramp( this.panner.positionZ, this.position.z, this.prev_position.z, t );
	}	

	this.prev_position.copy( this.position );

	this.first = false;
}

SpatialPanner.update_output = function(slot)
{
	return this.panner;
}

})();
