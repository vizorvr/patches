E2.p = E2.plugins["variable_local_read"] = function(core, node)
{
	this.desc = 'Read from a local variable using the name of the node.';
	
	this.input_slots = [];
	this.output_slots = [];
	
	this.core = core;
	this.node = node;
	this.data = null;
	
	if (!node.title)
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
	this.variables.unlock(this, this.node.title);
};

E2.p.prototype.renamed = function()
{
	this.variables.unlock(this, this.old_title);
	this.target_reg(this.node.title);
};

E2.p.prototype.variable_dt_changed = function(dt, arrayness)
{
	this.dt = dt;
	this.node.change_slot_datatype(E2.slot_type.output, this.slotId, dt, arrayness);
};

E2.p.prototype.variable_updated = function(value)
{
	this.updated = true;
	this.node.queued_update = 1; // Update next frame too...
	this.data = value;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	var reg_conn_count = this.variables.connection_changed(this.node.title, on);
	
	if(on && reg_conn_count === 1 && this.dt.id === E2.dt.ANY.id)
		this.variables.set_datatype(this.node.title, conn.dst_slot.dt, conn.dst_slot.array);
};

E2.p.prototype.update_output = function(slot)
{
	return this.data;
};

E2.p.prototype.target_reg = function(id)
{
	this.variables.lock(this, id);
	
	var r = this.variables.variables[id];

	this.dt = r.dt;

	if(r.dt.id !== this.core.datatypes.ANY.id)
	{
		this.variable_dt_changed(r.dt, r.array);
		this.data = this.variables.variables[id].value;
	}
};

E2.p.prototype.state_changed = function(ui) {
	if (!ui) {
		var n = this.node
		var outputs = this.node.getDynamicOutputSlots()

		if (!outputs.length)
			this.node.add_slot(E2.slot_type.output, {
				name: 'value',
				dt: this.core.datatypes.ANY,
				desc: ''
			})

		outputs = this.node.getDynamicOutputSlots()
		this.slotId = outputs[0].uid

		this.variables = n.parent_graph.variables
		this.target_reg(n.title)
	} else
		this.node.ui.dom.addClass('variable')
}

