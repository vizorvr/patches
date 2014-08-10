E2.p = E2.plugins["audio_delay_modulator"] = function(core, node)
{
	this.desc = 'Delay audio data.';
	
	this.input_slots = [ 
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'An audio source to delay.', def: null },
		{ name: 'delay', dt: core.datatypes.FLOAT, desc: 'Delay time (in seconds).', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'A delayed audio source', def: null }
	];
	
	this.delay_node = core.audio_ctx ? core.audio_ctx.createDelay(20.0) : null;
	this.src = null;
	this.delay = null;
	this.first = true;
};

E2.p.prototype.reset = function()
{
	this.first = true;
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
			data.connect(this.delay_node);
			this.delay_node.player = data.player;
		}		
	}
	else
	{
		this.delay = data > 20.0 ? 20.0 : data;
	}
};

E2.p.prototype.update_state = function()
{
	if((this.delay_node.delayTime.value !== this.delay) || this.first)
	{
		this.delay_node.delayTime.value = this.delay !== null ? this.delay : 0.0;
		this.first = false;
	}
};

E2.p.prototype.update_output = function(slot)
{
	return this.delay_node;
};
