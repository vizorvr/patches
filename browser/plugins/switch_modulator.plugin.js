E2.p = E2.plugins["switch_modulator"] = function(core, node)
{
	this.desc = 'Given an <b>index</b>, emit the supplied <b>true</b> value on the output slot matching the index and the <b>false</b> value on all others. If the index is invalid, the <b>false</b> value is emitted on all outputs.';
	
	this.input_slots = [ 
		{ name: 'index', dt: core.datatypes.FLOAT, desc: 'The selected index.', def: '-1' },
		{ name: 'true', dt: core.datatypes.ANY, desc: 'The value to emit on the output slot matching the current index.' },
		{ name: 'false', dt: core.datatypes.ANY, desc: 'The value to emit on any slot not matching the current index' }
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
};

E2.p.prototype.create_ui = function()
{
	var layout = make('div');
	var inp_rem = makeButton('Remove', 'Click to remove the last output.');
	var inp_add = makeButton('Add', 'Click to add another output.');
	
	inp_rem.css('width', '65px');
	inp_add.css({ 'width': '65px', 'margin-top': '5px' });
	
	inp_add.click(function(self) { return function(v)
	{
		var suid = self.node.add_slot(E2.slot_type.output, { name: '' + self.state.slot_uids.length, dt: self.lsg.dt });
		
		self.state.slot_uids.push(suid);
		self.lsg.add_dyn_slot(self.node.find_dynamic_slot(E2.slot_type.output, suid));
	}}(this));
	
	inp_rem.click(function(self) { return function(v)
	{
		if(self.state.slot_uids.length < 1)
			return;
			
		var suid = self.state.slot_uids.pop();
		
		self.lsg.remove_dyn_slot(self.node.find_dynamic_slot(E2.slot_type.output, suid));
		self.node.remove_slot(E2.slot_type.output, suid);
	}}(this));

	layout.append(inp_rem);
	layout.append(make('br'));
	layout.append(inp_add);
	
	return layout;
};

E2.p.prototype.reset = function()
{
	this.index = -1;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(this.lsg.connection_changed(on, conn, slot))
		this.true_value = this.false_value = this.lsg.core.get_default_value(this.lsg.dt);
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.index = Math.floor(data);
	else if(slot.index === 1)
		this.true_value = data;
	else
		this.false_value = data;
};	

E2.p.prototype.update_output = function(slot)
{
	return slot.index === this.index ? this.true_value : this.false_value;
};

E2.p.prototype.state_changed = function(ui)
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
