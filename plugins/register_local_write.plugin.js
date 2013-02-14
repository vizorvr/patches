E2.p = E2.plugins["register_local_write"] = function(core, node)
{
	this.desc = 'Write to a local register using name of the node, the value of which can subsequently be read.';
	
	this.input_slots = [];
	
	this.output_slots = [];
	
	this.state = 
	{
		slot_id: node.add_slot(E2.slot_type.input, { name: 'value', dt: core.datatypes.ANY, desc: '' })
	};
	
	this.node = node;
	
	if(!node.title)
		this.old_title = node.title = 'reg_' + node.uid;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.destroy = function()
{
	this.node.parent_graph.unlock_register(this, this.node.title);
};

E2.p.prototype.register_dt_changed = function(dt)
{
	this.node.change_slot_datatype(E2.slot_type.input, this.state.slot_id, dt);
};

E2.p.prototype.renamed = function()
{
	this.node.parent_graph.unlock_register(this, this.old_title);
	this.node.parent_graph.lock_register(this, this.node.title);
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	var pg = this.node.parent_graph;
	var reg_conn_count = pg.register_connection_changed(this.node.title, on);
	
	if(on && reg_conn_count === 1)
		pg.set_register_dt(this.node.title, conn.src_slot.dt);
};

E2.p.prototype.update_input = function(slot, data)
{
	this.node.parent_graph.write_register(this.node.title, data);
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.node.parent_graph.lock_register(this, this.node.title);
	else
		this.node.ui.dom.addClass('register');
};

