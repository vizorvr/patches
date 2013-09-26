E2.p = E2.plugins["switch_modulator"] = function(core, node)
{
	this.desc = 'Given an <b>index<\/>, emit the supplied <b>true<\/b> value on the output slot matching the index and the <b>false<\/> value on all others. If the index is invalid, the <b>false<\/> value is emitted on all outputs.';
	
	this.input_slots = [ 
		{ name: 'index', dt: core.datatypes.FLOAT, desc: 'The selected index.', def: '-1' }
	];
	
	this.output_slots = [
	];
	
	this.state = {
		slot_uids: [],
		true_uid: node.add_slot(E2.slot_type.input, { name: 'true', dt: core.datatypes.ANY }),
		false_uid: node.add_slot(E2.slot_type.input, { name: 'true', dt: core.datatypes.ANY }),
		attach_count: 0
	};
	
	this.node = node;
	this.dt = core.datatypes.ANY;
};

E2.p.prototype.create_ui = function()
{
	var layout = make('div');
	var inp_rem = $('<input id="rem_btn" type="button" value="Remove" title="Click to remove the last output." />');
	var inp_add = $('<input id="add_btn" type="button" value="Add" title="Click to add another output." />');
	
	inp_add.css('width', '65px');
	inp_rem.css('width', '65px');
	
	inp_add.click(function(self) { return function(v)
	{
		self.state.slot_uids.push(self.node.add_slot(E2.slot_type.output, { name: '' + self.state.slot_uids.length, dt: self.dt }));
	}}(this));
	
	inp_rem.click(function(self) { return function(v)
	{
		if(self.state.slot_uids.length < 1)
			return;
			
		self.node.remove_slot(E2.slot_type.output, self.state.slot_uids.pop());
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
	if((slot.index > 0 && slot.type === E2.slot_type.input) || slot.type === E2.slot_type.output)
	{
		if(on)
		{
			this.dt = slot.dt;
			
			if(
			this.state.attach_count++;
		}
	}
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

E2.p.prototype.state_updated = function(ui)
{
	if(!ui)
	{
		this.index = -1;
		this.true_value = null;
		this.false_value = null;
	}
};
