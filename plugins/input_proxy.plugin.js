E2.plugins["input_proxy"] = function(core, node) {
	var self = this;
	
	this.desc = 'Create a new type-less slot to route data into the current graph from its parent. When connected to a slot, it will assume its type until disconnected.';
	this.input_slots = [];
	this.output_slots = [];
	this.state = {};
	
	this.state.slot_id = node.add_slot(E2.slot_type.output, { name: 'output', dt: core.datatypes.ANY });
	this.data = null;
	
	if(!node.title)
		node.title = 'Input ' + node.uid;

	this.input_updated = function(data)
	{
		self.data = data;
		self.updated = true;
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		var plg = node.parent_graph.plugin;
		
		if(plg)
			plg.proxy_connection_changed(on, node, conn.dst_node, slot, conn.dst_slot);
	};
	
	this.update_output = function(slot)
	{
		return self.data;
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
			node.ui.dom.css('background-color', '#efef98');
	};
};
