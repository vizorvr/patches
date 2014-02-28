E2.p = E2.plugins["if_else_modulator"] = function(core, node)
{
	this.desc = 'Emits <b>true value</b> if <b>condition</b> is true and <b>false value</b> otherwise. The output only updates when the <b>condition</b> or relavant input value does. Any incoming data-flow to the value slot excluded by <b>condition</b> does not result in data emission.';
	
	this.input_slots = [ 
		{ name: 'condition', dt: core.datatypes.BOOL, desc: 'Send true to route <b>true value</b> to the output and false to route <b>false value</b>.', def: 'False' },
		{ name: 'true value', dt: core.datatypes.FLOAT, desc: 'Value to be send to output if <b>condition</b> is true', def: 0 } ,
		{ name: 'false value', dt: core.datatypes.FLOAT, desc: 'Value to be send to output if <b>condition</b> is false', def: 0  }
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits <b>true value</b> if <b>condition</b> is true and <b>false value</b> otherwise.', def: 'False value' }
	];
};

E2.p.prototype.reset = function()
{
	this.condition = false;
	this.yes = 0.0;
	this.no = 0.0;
	this.upd_state = [false, false, false]
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.condition = data;
	else if(slot.index === 1)
		this.yes = data;
	else
		this.no = data;
		
	this.upd_state[slot.index] = true;
};	

E2.p.prototype.update_state = function()
{
	var us = this.upd_state;
	
	this.updated = us[0] || us[this.condition ? 1 : 2];
	us[0] = us[1] = us[2] = false;
}

E2.p.prototype.update_output = function(slot)
{
	return this.condition ? this.yes : this.no;
};
