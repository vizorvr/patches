(function() {

var SwitchModulator = E2.plugins.switch_modulator = function(core, node) {
	var that = this

	this.desc = 'Given an <b>index</b>, emit the supplied <b>true</b> value on the output slot matching the index and the <b>false</b> value on all others. If the index is invalid, the <b>false</b> value is emitted on all outputs.';
	
	this.input_slots = [ 
		{ name: 'index', dt: core.datatypes.FLOAT, desc: 'The selected index.', def: -1 },
		{ name: 'true', dt: core.datatypes.ANY, desc: 'The value to emit on the output slot matching the current index.', def: null },
		{ name: 'false', dt: core.datatypes.ANY, desc: 'The value to emit on any slot not matching the current index', def: null }
	];
	
	this.output_slots = [];
	
	this.state = {
		slot_uids: []
	};
	
	this.core = core;
	this.node = node;
	this.lsg = new LinkedSlotGroup(core, node, [this.input_slots[1], this.input_slots[2]], []);
	this.true_value = null;
	this.false_value = null;

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
};

SwitchModulator.prototype.create_ui = function() {
	var that = this
	var layout = make('div');
	var inp_rem = makeButton('Remove', 'Click to remove the last output.');
	var inp_add = makeButton('Add', 'Click to add another output.');
	
	inp_rem.css('width', '65px');
	inp_add.css({ 'width': '65px', 'margin-top': '5px' });
	
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

	layout.append(inp_rem);
	layout.append(make('br'));
	layout.append(inp_add);
	
	return layout;
};

SwitchModulator.prototype.reset = function()
{
	this.index = -1;
};

SwitchModulator.prototype.connection_changed = function(on, conn, slot)
{
	if(this.lsg.connection_changed(on, conn, slot))
		this.true_value = this.false_value = this.lsg.core.get_default_value(this.lsg.dt);
};

SwitchModulator.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.index = Math.floor(data);
	else if(slot.index === 1)
		this.true_value = data;
	else
		this.false_value = data;
};	

SwitchModulator.prototype.update_output = function(slot)
{
	return slot.index === this.index ? this.true_value : this.false_value;
};

SwitchModulator.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		for(var i = 0, len = this.state.slot_uids.length; i < len; i++)
		{
			this.lsg.add_dyn_slot(this.node.find_dynamic_slot(E2.slot_type.output, this.state.slot_uids[i]));
		}
		
		this.index = -1;
		this.true_value = this.false_value = this.lsg.infer_dt();
	}
};


})();