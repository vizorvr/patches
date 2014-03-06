E2.p = E2.plugins["output_proxy"] = function(core, node)
{
	this.desc = 'Create a new type-less slot to route data out of the current graph to its parent. When connected to a slot, it will assume its type until disconnected. Renaming this plugin will rename the corresponding parent slot.';
	
	this.input_slots = [];
	
	this.output_slots = [];
	
	this.state = 
	{
		slot_id: node.add_slot(E2.slot_type.input, { name: 'output', dt: core.datatypes.ANY, desc: 'Connect a slot of any type to this plugin, to have the parent slot assume its datatype and forward data from this plugin.' })
	};
	
	this.core = core;
	this.node = node;
	this.data = null;
	this.changed = false;
	
	if(!node.title)
		node.title = 'output_' + node.uid;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	var plg = this.node.parent_graph.plugin;
	
	if(plg)
		plg.proxy_connection_changed(on, this.node, conn.src_node, slot, conn.src_slot);
};

E2.p.prototype.update_input = function(slot, data)
{
	var node = this.node;
	
	this.data = data;
	this.changed = true;
	
	if(node.parent_graph.plugin)
	{
		var p = node.parent_graph.plugin;
		
		p.updated_sids.push(p.state.output_sids[node.uid])
		p.updated = true;
	}
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
	{
		this.node.ui.dom.addClass('proxy');
		this.data = this.core.get_default_value(this.node.dyn_inputs[0].dt);
	}
};
