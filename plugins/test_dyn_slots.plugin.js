E2.plugins["test_dyn_slots"] = function(core, node) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [];
	this.state = { dyn_in_slot_uids: [], dyn_out_slot_uids: [], slot_vals: [], id: 0 };
	
	this.create_ui = function()
	{
		var div = make('div');
		var add_btn = $('<input id="add" type="button" value="Add" />');
		var rem_last_btn = $('<input id="rem_l" type="button" value="Rem last" />');
		var rem_first_btn = $('<input id="rem_f" type="button" value="Rem first" />');
		
		add_btn.click(function(e) 
		{
			var idx = self.state.dyn_in_slot_uids.length;
			
			self.state.dyn_in_slot_uids.push(node.add_slot(E2.slot_type.input, { name: 'in_' + self.state.id, dt: core.datatypes.BOOL }));
			self.state.dyn_out_slot_uids.push(node.add_slot(E2.slot_type.output, { name: 'out_' + self.state.id, dt: core.datatypes.BOOL }));
			self.state.id++;
		});
		
		rem_last_btn.click(function(e) 
		{
			var idx = self.state.dyn_in_slot_uids.length - 1;
			
			if(idx > -1)
			{
				node.remove_slot(E2.slot_type.input, self.state.dyn_in_slot_uids[idx]);
				node.remove_slot(E2.slot_type.output, self.state.dyn_out_slot_uids[idx]);
				self.state.dyn_in_slot_uids.splice(idx, 1);
				self.state.dyn_out_slot_uids.splice(idx, 1);
			}
		});
	
		rem_first_btn.click(function(e) 
		{
			if(self.state.dyn_in_slot_uids.length > 0)
			{
				node.remove_slot(E2.slot_type.input, self.state.dyn_in_slot_uids[0]);
				node.remove_slot(E2.slot_type.output, self.state.dyn_out_slot_uids[0]);
				self.state.dyn_in_slot_uids.splice(0, 1);
				self.state.dyn_out_slot_uids.splice(0, 1);
			}
		});

		div.append(add_btn);
		div.append(rem_last_btn);
		div.append(rem_first_btn);
		return div;
	};
	
	this.update_input = function(slot, data)
	{
		self.state.slot_vals[slot.index] = data;
		msg('Received dynamic input: index = ' + slot.index + ' is ' + data);
	};
	
	this.update_output = function(slot)
	{
		return self.state.slot_vals[slot.index];
	};
};
