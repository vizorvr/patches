/*

"Make an Array plugin with dynamic number of ANY datatype inputs, and an index input that changes the current output value of the plugin.

inputs: index, 0, 1, 2, 3, ... 
outputs: output
Eg. feed in 8 images, and alternate between the images with index"

https://github.com/vizorvr/vizor-create/issues/31

*/

(function() {

var ArraySwitch = E2.plugins['array_switch_modulator'] = function ArraySwitch(core, node) {
	this.desc = 'Revolver style array switch. Set up n inputs, then choose which one to output.';
	
	this.input_slots = [ 
		{ name: 'number', dt: E2.dt.FLOAT, desc: 'Input number to select for output.', def: 0 }
	];
	
	this.output_slots = [
		{ name: 'out', dt: E2.dt.ANY, desc: 'Emits the selected input.' }
	];

	this.state = {
		slot_uids: []
	}

	this.core = core
	this.node = node
	this.lsg = new LinkedSlotGroup(core, node, [], [this.output_slots[0]])

	this.number = -1
	this.values = []
}

ArraySwitch.prototype.create_ui = function() {
	var that = this
	var layout = make('div')
	var removeButton = makeButton('Remove', 'Click to remove the last input.')
	var addButton = makeButton('Add', 'Click to add another input.')
	
	removeButton.css('width', '65px')
	addButton.css({ 'width': '65px', 'margin-top': '5px' })
	
	addButton.click(function() {
		var suid = that.node.add_slot(E2.slot_type.input, {
			name: '' + (that.state.slot_uids.length),
			dt: that.lsg.dt
		})

		that.state.slot_uids.push(suid)
		that.lsg.add_dyn_slot(that.node.find_dynamic_slot(E2.slot_type.input, suid))
	})
	
	removeButton.click(function(v) {
		if (that.state.slot_uids.length < 1)
			return
		
		var suid = that.state.slot_uids.pop()
		
		that.lsg.remove_dyn_slot(that.node.find_dynamic_slot(E2.slot_type.input, suid))
		that.node.remove_slot(E2.slot_type.input, suid)
	})

	layout.append(removeButton)
	layout.append(make('br'))
	layout.append(addButton)
	
	return layout
}

ArraySwitch.prototype.update_input = function(slot, data) {
	if (slot.uid === undefined) {
		if (slot.index === 0) {
			var n = Math.floor(data)
			if (this.number !== n) {
				this.number = n
				this.updated = true
			}
			return 
		}
	} else { // dynamic slot
		this.values[slot.index] = data
	}
}

ArraySwitch.prototype.update_state = function() {
	if (this.value != this.values[this.number]) {
		this.value = this.values[this.number]
		this.updated = true
	}
}

ArraySwitch.prototype.update_output = function(slot) {
	if (this.value !== undefined)
		return this.value
	return this.lsg.core.get_default_value(this.lsg.dt)
}

ArraySwitch.prototype.state_changed = function(ui) {
	if (!ui) {
		for(var i = 0, len = this.state.slot_uids.length; i < len; i++) {
			this.lsg.add_dyn_slot(this.node.find_dynamic_slot(E2.slot_type.input, this.state.slot_uids[i]));
		}
		
		this.number = -1;
		this.value = this.lsg.infer_dt();
	}
};


})()
