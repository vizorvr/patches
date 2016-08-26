(function() {

var SpatialListener = E2.plugins.audio_spatial_listener = function(core, node) 
{
	this.desc = 'Spatial Listener.';
	
	this.input_slots = [ 
		{ name: 'position', dt: core.datatypes.VECTOR, desc: 'Position.', def: core.renderer.vector_origin },
		{ name: 'forward', dt: core.datatypes.VECTOR, desc: 'Forward Vector.', def: core.renderer.vector_origin },
		{ name: 'up', dt: core.datatypes.VECTOR, desc: 'Up Vector.', def: new THREE.Vector3(0,1,0) /* whatever */ } 
	];
	
	this.output_slots = [];
	
	this.position = null;
	this.forward = null;
	this.up = null;

	this.audioContext = core.audioContext;
	this.first = true;
}

SpatialListener.prototype.reset = function()
{
	this.first = true;
}

SpatialListener.prototype.update_input = function(slot, data)
{
	switch( slot.index ) {
		case 0: this.position = data;	break;
		case 1:	this.forward = data;	break;
		case 2:	this.up = data;			break;
	}
}

SpatialListener.prototype.update_state = function(uc)
{
	var listener = this.audioContext.listener;

	if( this.position !== null ) {
		listener.setPosition(this.position.x,this.position.y,this.position.z);
	}

	if( this.forward !== null && this.up !== null) {
		listener.setOrientation(
			this.forward.x,this.forward.y,this.forward.z,
			this.up.x,this.up.y,this.up.z
		);
	}	

	this.first = false;
}

SpatialListener.prototype.update_output = function(slot)
{
	this.updated = true;
}

})();
