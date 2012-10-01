E2.plugins["output_proxy"] = function(core, node) {
	var self = this;
	
	this.desc = 'Create a new type-less slot to route data out of the current graph to its parent. When connected to a slot, it will assume its type until disconnected. Renaming this plugin will rename the corresponding parent slot.';
	this.input_slots = [];
	this.output_slots = [];
	this.state = {};
	
	this.state.slot_id = node.add_slot(E2.slot_type.input, { name: 'input', dt: core.datatypes.ANY, desc: 'Connect a slot of any type to this plugin, to have the parent slot assume its datatype and forward data from this plugin.' });
	this.data = null;
	this.changed = false;
	
	if(!node.title)
		node.title = 'output_' + node.uid;
	
	this.reset = function()
	{
		self.updated = true;
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		var plg = node.parent_graph.plugin;
		
		if(plg)
			plg.proxy_connection_changed(on, node, conn.src_node, slot, conn.src_slot);
	};
	
	this.update_input = function(slot, data)
	{
		self.data = data;
		self.changed = true;
		
		if(node.parent_graph.plugin)
		{
			var p = node.parent_graph.plugin;
			
			p.updated_sids.push(p.state.output_sids[node.uid])
			p.updated = true;
		}
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
			node.ui.dom.addClass('proxy');
	};
};
