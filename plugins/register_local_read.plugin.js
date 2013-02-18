E2.p = E2.plugins["register_local_read"] = function(core, node)
{
	this.desc = 'Read from a local register using the name of the node.';
	
	this.input_slots = [];
	
	this.output_slots = [];
	
	this.state = 
	{
		slot_id: node.add_slot(E2.slot_type.output, { name: 'value', dt: core.datatypes.ANY, desc: '' })
	};
	
	this.node = node;
	this.data = null;
	
	if(!node.title)
		this.old_title = node.title = 'reg_' + node.uid;
};

E2.p.prototype.destroy = function()
{
	this.node.parent_graph.unlock_register(this, this.node.title);
};

E2.p.prototype.renamed = function()
{
	this.node.parent_graph.unlock_register(this, this.old_title);
	this.node.parent_graph.lock_register(this, this.node.title);
};

E2.p.prototype.register_dt_changed = function(dt)
{
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
	var pg = this.node.parent_graph;
	var reg_conn_count = pg.register_connection_changed(this.node.title, on);
	
	if(on && reg_conn_count === 1)
		pg.set_register_dt(this.node.title, conn.dst_slot.dt);
};

E2.p.prototype.update_output = function(slot)
{
	return this.data;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		var id = this.node.title;
		var n = this.node;
		var pg = n.parent_graph;
		
		pg.lock_register(this, id);
		pg.set_register_dt(id, n.find_dynamic_slot(E2.slot_type.output, this.state.slot_id).dt);
		this.data = pg.registers[id].value;
	}
	else
		this.node.ui.dom.addClass('register');
};

