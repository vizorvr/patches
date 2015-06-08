(function(){

var AudioGainModulator = E2.plugins.audio_gain_modulator = function(core, node) {
	var that = this

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

	this.node.on('slotAdded', function(slot) {
		that.state.slot_uids.push(slot.uid)
		that.updated = true
	})

	this.node.on('slotRemoved', function(slot) {
		that.state.slot_uids = that.state.slot_uids
			.filter(function(uid) {
				return (slot.uid !== uid)
			})

		that.updated = true
	})

}

AudioGainModulator.prototype.reset = function() {
	this.first = true;
}

AudioGainModulator.prototype.create_ui = function() {
	var that = this

	var layout = make('div')
	var inp_add = makeButton('+', 'Click to add another input.')
	var inp_rem = makeButton('-', 'Click to remove the last input.')
	
	inp_add.css({'width': '20px', 'float': 'left'})
	inp_rem.css({'width': '20px', 'float': 'right', 'margin-left': '5px'})
	
	inp_add.click(function() {
		E2.app.graphApi.addSlot(that.node.parent_graph, that.node, {
			type: E2.slot_type.input,
			name: that.state.slot_uids.length + '',
			dt: that.core.datatypes.OBJECT
		})
	})
	
	inp_rem.click(function() {
		if (that.state.slot_uids.length < 1)
			return;
			
		var suid = that.state.slot_uids[that.state.slot_uids.length-1]
		E2.app.graphApi.removeSlot(that.node.parent_graph, that.node, suid)
	})

	layout.append(inp_add)
	layout.append(inp_rem)
	
	return layout;
}

AudioGainModulator.prototype.update_input = function(slot, data)
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

AudioGainModulator.prototype.update_state = function()
{
	if((this.gain_node.gain.value !== this.gain) || this.first)
	{
		this.gain_node.gain.value = this.gain !== null ? this.gain : 1.0;
		this.first = false;
	}
};

AudioGainModulator.prototype.update_output = function(slot)
{
	return this.gain_node;
};

AudioGainModulator.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		for(var i = 0, len = this.state.slot_uids.length; i < len; i++)
			this.lsg.add_dyn_slot(this.node.find_dynamic_slot(E2.slot_type.input, this.state.slot_uids[i]));
	}
};


})();

