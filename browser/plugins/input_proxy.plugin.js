E2.p = E2.plugins["input_proxy"] = function(core, node)
{
	this.desc = 'Create a new type-less slot to route data into the current graph from its parent. When connected to a slot, it will assume its type until disconnected. Renaming this plugin will rename the corresponding parent slot.';
	
	this.input_slots = [];
	
	this.output_slots = [];
	
	this.state = 
	{
		slot_id: node.add_slot(E2.slot_type.output, { name: 'input', dt: core.datatypes.ANY, desc: 'Connect this to a slot of any type, to have the parent slot assume its datatype and forward data from the parent graph.' })
	};

	this.core = core;
	this.node = node;
	this.data = null;

	if(!node.title)
		node.title = 'input_' + node.uid;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.input_updated = function(data)
{
	this.data = data;
	this.updated = true;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	var plg = this.node.parent_graph.plugin;
	
	if(plg)
		plg.proxy_connection_changed(on, this.node, conn.dst_node, slot, conn.dst_slot);
};

E2.p.prototype.update_output = function(slot)
{
	return this.data;
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
		this.node.ui.dom.addClass('proxy');
};
