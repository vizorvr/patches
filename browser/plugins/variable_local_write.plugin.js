E2.p = E2.plugins["variable_local_write"] = function(core, node)
{
	this.desc = 'Write to a local variable using name of the node, the value of which can subsequently be read.';
	
	this.input_slots = [];
	this.output_slots = [];
	
	this.core = core;
	this.node = node;
	
	if(!node.title)
		this.old_title = node.title = 'reg_' + (node.parent_graph.variables.count() + 1);
	else
		this.old_title = node.title;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.destroy = function()
{
	this.regs.unlock(this, this.node.title);
};

E2.p.prototype.variable_dt_changed = function(dt)
{
	this.node.change_slot_datatype(E2.slot_type.input, this.slotId, dt);
};

E2.p.prototype.renamed = function()
{
	this.regs.unlock(this, this.old_title);
	this.regs.lock(this, this.node.title);
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	var reg_conn_count = this.regs.connection_changed(this.node.title, on);
	
	if(on && reg_conn_count === 1)
		this.regs.set_datatype(this.node.title, conn.src_slot.dt);
};

E2.p.prototype.update_input = function(slot, data)
{
	this.regs.write(this.node.title, data);
};

E2.p.prototype.target_reg = function(id)
{
	var dslot = this.node.find_dynamic_slot(E2.slot_type.input, this.slotId);
	
	this.regs.lock(this, id);

	var rdt = this.regs.variables[id].dt;
	
	if(rdt !== this.core.datatypes.ANY)
		this.variable_dt_changed(dslot.dt);
};

E2.p.prototype.state_changed = function(ui) {
	if (!ui) {
		var n = this.node;
		var inputs = this.node.getDynamicInputSlots()

		if (!inputs.length)
			this.node.add_slot(E2.slot_type.input, {
				name: 'value',
				dt: this.core.datatypes.ANY,
				desc: ''
			})

		inputs = this.node.getDynamicInputSlots()
		this.slotId = inputs[0].uid

		this.regs = n.parent_graph.variables
		this.target_reg(n.title)
	} else
		this.node.ui.dom.addClass('variable')
}

