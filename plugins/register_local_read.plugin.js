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

E2.p.prototype.renamed = function()
{
	this.node.parent_graph.unlock_register(this.old_title);
	this.node.parent_graph.lock_register(this.node, this.node.title);
};

E2.p.prototype.register_value_updated = function(value)
{
	this.updated = true;
	this.data = value;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	// This will also be called when we're destroyed, thus neatly taking care
	// of decresing the reference count in that case too.
	if(!on)
		this.node.parent_graph.unlock_register(this.node.title);
};

E2.p.prototype.update_output = function(slot)
{
	return this.data;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.node.parent_graph.lock_register(this.node, this.node.title);
};

