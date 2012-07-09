E2.plugins["output_proxy"] = function(core, node) {
	var self = this;
	
	this.desc = 'Create a new type-less slot to route data out of the current graph to its parent. When connected to a slot, it will assume its type until disconnected.';
	this.input_slots = [];
	this.output_slots = [];
	this.state = {};
	
	this.state.slot_id = node.add_slot(E2.slot_type.input, { name: 'input', dt: core.datatypes.ANY });
	this.data = null;
	this.changed = false;
	
	if(!node.title)
		node.title = 'Output ' + node.uid;
	
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
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
			node.ui.dom.addClass('proxy');
	};
};
