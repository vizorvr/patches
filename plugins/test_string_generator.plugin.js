g_Plugins["test_string_generator"] = function(core) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'value', dt: core.datatypes.STRING } ];
	this.state = { val: '' };
	
	this.create_ui = function()
	{
		var inp = $('<input type="text" value="" style="width: 30px;" />');
		
		inp.change(function(e) {
			self.state.val = inp.text();
		});
		
		return inp;
	};

	this.update_state = function(delta_t)
	{
	};
	
	this.update_output = function(index)
	{
		return self.state.val;
	};
};
