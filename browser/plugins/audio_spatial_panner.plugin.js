(function() {

var SpatialPanner = E2.plugins.audio_spatial_panner = function(core, node) 
{
	this.desc = 'Spatial Panner (Advanced).';
	
	this.input_slots = [ 
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'An audio source to spatialize.', def: null },
		{ name: 'position', dt: core.datatypes.VECTOR, desc: 'Position.', def: core.renderer.vector_origin },
		{ name: 'orientation', dt: core.datatypes.VECTOR, desc: 'Orientation.', def: core.renderer.vector_origin },
		{ name: 'coneinnerangle', dt: core.datatypes.FLOAT, desc: 'Cone Inner Angle.', def: 360 }, 	
		{ name: 'coneouterangle', dt: core.datatypes.FLOAT, desc: 'Cone Outer Angle.', def: 360 },
		{ name: 'coneoutergain', dt: core.datatypes.FLOAT, desc: 'Cone Outer Gain.', def: 0 },
		{ name: 'refdistance', dt: core.datatypes.FLOAT, desc: 'Reference Distance.', def: 1 },
		{ name: 'maxdistance', dt: core.datatypes.FLOAT, desc: 'Maximum Distance.', def: 10000 },
		{ name: 'rolloff', dt: core.datatypes.FLOAT, desc: 'Rolloff Factor.', def: 1 }
	];
	
	this.output_slots = [
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'A spatialized audio source', def: null },
	];
	
	this.panner = core.audioContext ? core.audioContext.createPanner() : null;
	this.audioContext = core.audioContext;
	this.src = null;
	this.position = null;
	this.orientation = null;

	this.coneInnerAngle = null;
	this.coneOuterAngle = null;
	this.coneOuterGain = null;

	this.refDistance = null;
	this.maxDistance = null;
	this.rolloff = null;

	this.first = true;
}

SpatialPanner.prototype.reset = function()
{
	this.first = true;
}

SpatialPanner.prototype.update_input = function(slot, data)
{
	switch(slot.index) {
		case 0:	{
			if(this.src && this.src.disconnect)
				this.src.disconnect(0);

			if(this.src = data)
			{
				if(data.connect)
					data.connect(this.panner);

				this.panner.player = data.player;
			}		
		} break;
		case 1:	this.position = data; 		break;
		case 2:	this.orientation = data;	break;
		case 3: this.coneInnerAngle = data; break;
		case 4: this.coneOuterAngle = data; break;
		case 5: this.coneOuterGain = data;	break;
		case 6: this.refDistance = data;	break;
		case 7: this.maxDistance = data;	break;
		case 7: this.rolloff = data;		break;
	}
}

SpatialPanner.prototype.update_state = function(uc)
{
	if( this.position !== null ) 
		this.panner.setPosition( this.position.x, this.position.y, this.position.z );

	if( this.orientation !== null )
		this.panner.setOrientation( this.orientation.x, this.orientation.y, this.orientation.z );

	this.first = false;
}

SpatialPanner.prototype.update_output = function()
{
	return this.panner;
}

})();
