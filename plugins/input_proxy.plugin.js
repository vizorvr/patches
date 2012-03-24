E2.plugins["input_proxy"] = function(core, node) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [];
	this.state = {};
	
	this.state.slot_id = node.add_slot(E2.slot_type.output, { name: 'output', dt: core.datatypes.ANY });
	this.data = null;
	
	node.title = 'Input ' + node.uid;

	this.input_updated = function(data)
	{
		self.data = data;
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		
	};
	
	this.update_output = function(slot)
	{
		return self.data;
	};
};
