E2.p = E2.plugins["register_local_read"] = function(core, node)
{
	this.desc = 'Read from a local register using the name of the node.';
	
	this.input_slots = [];
	this.output_slots = [];
	
	this.state = 
	{
		slot_id: null
	};
	
	this.core = core;
	this.node = node;
	this.data = null;
	
	if(!node.title)
		this.old_title = node.title = 'reg_' + (node.parent_graph.registers.count() + 1);
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

E2.p.prototype.renamed = function()
{
	this.regs.unlock(this, this.old_title);
	this.target_reg(this.node.title);
};

E2.p.prototype.register_dt_changed = function(dt)
{
	this.dt = dt;
	this.node.change_slot_datatype(E2.slot_type.output, this.state.slot_id, dt);
};

E2.p.prototype.register_updated = function(value)
{
	this.updated = true;
	this.node.queued_update = 1; // Update next frame too...
	this.data = value;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	var reg_conn_count = this.regs.connection_changed(this.node.title, on);
	
	if(on && reg_conn_count === 1 && this.dt === this.core.datatypes.ANY)
		this.regs.set_datatype(this.node.title, conn.dst_slot.dt);
};

E2.p.prototype.update_output = function(slot)
{
	return this.data;
};

E2.p.prototype.target_reg = function(id)
{
	this.regs.lock(this, id);
	
	var rdt = this.regs.registers[id].dt;
	
	this.dt = rdt;

	if(rdt !== this.core.datatypes.ANY)
	{
		this.register_dt_changed(rdt);
		this.data = this.regs.registers[id].value;
	}
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		var n = this.node;

		if(this.state.slot_id === null)
			this.state.slot_id = n.add_slot(E2.slot_type.output, { name: 'value', dt: this.core.datatypes.ANY, desc: '' });
		
		debugger;
		this.regs = n.parent_graph.registers;
		this.target_reg(n.title);
	}
	else
		this.node.ui.dom.addClass('register');
};

