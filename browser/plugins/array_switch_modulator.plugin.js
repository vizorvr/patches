/*

"Make an Array plugin with dynamic number of ANY datatype inputs, 
 and an index input that changes the current output value of the plugin.

inputs: number, 0, 1, 2, 3, ... 
outputs: output, length
Eg. feed in 8 images, and alternate between the images with number"

https://github.com/vizorvr/vizor-create/issues/31

*/

(function() {

var ArraySwitch = E2.plugins.array_switch_modulator = function ArraySwitch(core, node) {
	var that = this

	this.desc = 'Revolver style array switch. Set up n inputs, then choose which one to output.';
	
	this.input_slots = [ 
		{ name: 'number', dt: E2.dt.FLOAT, desc: 'Input number to select for output.', def: 0 }
	]
	
	this.output_slots = [
		{ name: 'value', dt: E2.dt.ANY, desc: 'Emits the selected input.' },
		{ name: 'length', dt: E2.dt.FLOAT, desc: 'Emits the number of inputs = the length of the array.' }
	]

	this.state = {
		slot_uids: []
	}

	this.core = core
	this.node = node
	this.lsg = new LinkedSlotGroup(core, node, [], [this.output_slots[0]])

	this.number = -1
	this.values = []

	this.node.on('slotAdded', function(slot) {
		that.state.slot_uids.push(slot.uid)
		that.updated = true
	})

	this.node.on('slotRemoved', function(slot) {
		that.state.slot_uids = that.state.slot_uids
			.filter(function(uid) {
				return (slot.uid !== uid)
			})

		that.updated = true
	})
}

ArraySwitch.prototype.create_ui = function() {
	var that = this
	var layout = make('div')
	var removeButton = makeButton('Remove', 'Click to remove the last input.')
	var addButton = makeButton('Add', 'Click to add another input.')
	
	removeButton.css('width', '65px')
	addButton.css({ 'width': '65px', 'margin-top': '5px' })
	
	addButton.click(function() {
		E2.app.graphApi.addSlot(that.node.parent_graph, that.node, {
			type: E2.slot_type.input,
			name: that.state.slot_uids.length + '',
			dt: that.lsg.dt
		})
	})

	removeButton.click(function() {
		if (that.state.slot_uids.length < 1)
			return

		var suid = that.state.slot_uids[that.state.slot_uids.length-1]
		E2.app.graphApi.removeSlot(that.node.parent_graph, that.node, suid)
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
	if (this.value !== this.values[this.number]) {
		this.value = this.values[this.number]
		this.updated = true
	}
}

ArraySwitch.prototype.update_output = function(slot) {
	if (slot.index === 1) {
		return this.state.slot_uids.length
	}

	if (this.value !== undefined)
		return this.value

	return this.core.get_default_value(this.lsg.dt)
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


})();

