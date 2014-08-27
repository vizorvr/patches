E2.p = E2.plugins["audio_gain_modulator"] = function(core, node)
{
	this.desc = '(De)amplify or mix audio data.';
	
	this.input_slots = [ 
		{ name: 'gain', dt: core.datatypes.FLOAT, desc: 'Amplification scalar.', def: null }
	];
	
	this.output_slots = [
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'A (de)amplified audio source', def: null }
	];
	
	this.state = {
		slot_uids: []
	};
	
	this.core = core;
	this.node = node;
	this.gain_node = core.audio_ctx ? core.audio_ctx.createGain() : null;
	this.lsg = new LinkedSlotGroup(core, node, [], []);
	this.srcs = [];
	this.gain = null;
	this.first = true;
};

E2.p.prototype.reset = function()
{
	this.first = true;
};

E2.p.prototype.create_ui = function()
{
	var layout = make('div');
	var inp_add = makeButton('+', 'Click to add another input.');
	var inp_rem = makeButton('-', 'Click to remove the last input.');
	
	inp_add.css({'width': '20px', 'float': 'left'});
	inp_rem.css({'width': '20px', 'float': 'right', 'margin-left': '5px'});
	
	inp_add.click(function(self) { return function(v)
	{
		var suid = self.node.add_slot(E2.slot_type.input, { name: '' + self.state.slot_uids.length, dt: self.core.datatypes.OBJECT });
		
		self.state.slot_uids.push(suid);
		self.lsg.add_dyn_slot(self.node.find_dynamic_slot(E2.slot_type.input, suid));
	}}(this));
	
	inp_rem.click(function(self) { return function(v)
	{
		if(self.state.slot_uids.length < 1)
			return;
			
		var suid = self.state.slot_uids.pop();
		
		self.lsg.remove_dyn_slot(self.node.find_dynamic_slot(E2.slot_type.input, suid));
		self.node.remove_slot(E2.slot_type.input, suid);
	}}(this));

	layout.append(inp_add);
	layout.append(inp_rem);
	
	return layout;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.uid !== undefined)
	{
		if(this.srcs[slot.index])
			this.srcs[slot.index].disconnect(0);
		
		this.srcs[slot.index] = data;
		
		if(data)
		{
			data.connect(this.gain_node);
			this.gain_node.player = data.player;
		}		
	}
	else if(slot.index === 0)
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

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		for(var i = 0, len = this.state.slot_uids.length; i < len; i++)
			this.lsg.add_dyn_slot(this.node.find_dynamic_slot(E2.slot_type.input, this.state.slot_uids[i]));
	}
};
