(function(){

var InputProxy = E2.plugins.input_proxy = function(core, node) {
	this.desc = 'Create a new type-less slot to route data into the current graph from its parent. When connected to a slot, it will assume its type until disconnected. Renaming this plugin will rename the corresponding parent slot.';
	
	this.input_slots = []
	this.output_slots = []
	
	node.add_slot(E2.slot_type.output, {
		name: 'input',
		dt: core.datatypes.ANY,
		desc: 'Connect this to a slot of any type, to have the parent slot assume its datatype and forward data from the parent graph.'
	})

	this.core = core;
	this.node = node;
	this.data = null;

	if (!node.title)
		node.title = 'input'
}

InputProxy.prototype.reset = function() {
	this.updated = true;
}

InputProxy.prototype.input_updated = function(data) {
	this.data = data;
	this.updated = true;
}

InputProxy.prototype.connection_changed = function(on, conn, slot) {
	var plg = this.node.parent_graph.plugin;

	if (plg)
		plg.proxy_connection_changed(on,
			this.node,
			conn.dst_node,
			slot,
			conn.dst_slot)
}

InputProxy.prototype.update_output = function() {
	return this.data;
}

InputProxy.prototype.state_changed = function(ui) {

}

})();
