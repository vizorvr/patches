E2.p = E2.plugins["switch_modulator"] = function(core, node)
{
	this.desc = 'Given an <b>index</b>, emit the supplied <b>true</b> value on the output slot matching the index and the <b>false</b> value on all others. If the index is invalid, the <b>false</b> value is emitted on all outputs.';
	
	this.input_slots = [ 
		{ name: 'index', dt: core.datatypes.FLOAT, desc: 'The selected index.', def: '-1' }
	];
	
	this.output_slots = [
	];
	
	this.state = {
		slot_uids: []
	};
	
	this.core = core;
	this.node = node;
	this.dt = core.datatypes.ANY;
	this.slot_t_id = null;
	this.slot_f_id = null;
};

E2.p.prototype.create_ui = function()
{
	var layout = make('div');
	var inp_rem = makeButton('Remove', 'Click to remove the last output.');
	var inp_add = makeButton('Add', 'Click to add another output.');
	
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
	if(slot.uid !== undefined) // Custom slot?
	{
		
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

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.index = -1;
		
		if(this.slot_t_id === null)
			this.slot_t_id = this.node.add_slot(E2.slot_type.input, { name: 'true', dt: this.core.datatypes.ANY });
			
		if(this.slot_f_id === null)
			this.slot_f_id = this.node.add_slot(E2.slot_type.input, { name: 'false', dt: this.core.datatypes.ANY });
	}
};
