E2.p = E2.plugins["const_float_generator"] = function(core, node) {
	this.desc = 'Emits a float constant specified in an input field. If an invalid string in entered, the field is reset to the previous value.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The currently entered value.', def: 1 }
	];
	
	this.state = { val: 1.0 };
	this.core = core;
	this.node = node;
};

E2.p.prototype.reset = function() {}

E2.p.prototype.create_ui = function() {
	var that = this
	var inp = this.$input = 
		$('<input type="number" step="0.1" value="1.0" style="width: 50px;" />')
	
	inp.css('border', '1px solid #999')
	inp.on('change', function() {
		var oldValue = that.state.val
		var newValue = that.state.val

		try { 
			var v = parseFloat(inp.val())
			if (!isNaN(v))
				newValue = v
		} catch(e) {
			return;
		}

		E2.app.undoManager.execute(
			new E2.commands.graph.ChangePluginState(
				that.node.parent_graph,
				that.node,
				'val',
				oldValue,
				newValue
		))
	})

	this.etf = new ExpandableTextfield(this.node, inp, 7)

	return inp;
}

E2.p.prototype.update_output = function(slot) {
	return this.state.val
}

E2.p.prototype.state_changed = function(ui) {
	if (ui) {
		ui.val('' + this.state.val)
	}
}
