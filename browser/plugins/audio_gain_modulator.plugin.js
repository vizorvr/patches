E2.p = E2.plugins["audio_gain_modulator"] = function(core, node)
{
	this.desc = '(De)amplify audio data.';
	
	this.input_slots = [ 
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'An audio source to (de)amplify.', def: null },
		{ name: 'gain', dt: core.datatypes.FLOAT, desc: 'Amplification scalar.', def: null }
	];
	
	this.output_slots = [
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'A (de)amplified audio source', def: null }
	];
	
	this.gain_node = core.audio_ctx ? core.audio_ctx.createGain() : null;
	this.src = null;
	this.gain = null;
	this.first = true;
};

E2.p.prototype.reset = function()
{
	this.first = true;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		if(this.src)
			this.src.disconnect(0);
		
		this.src = data;
		
		if(data)
		{
			data.connect(this.gain_node);
			this.gain_node.player = data.player;
		}		
	}
	else
	{
		this.gain = data;
	}
};

E2.p.prototype.update_state = function()
{
	if((this.gain_node.gain.value !== this.gain) || this.first)
	{
		this.gain_node.gain.value = this.gain !== null ? this.gain : 1.0;
		this.first = false;
	}
};

E2.p.prototype.update_output = function(slot)
{
	return this.gain_node;
};
