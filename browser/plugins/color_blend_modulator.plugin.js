E2.p = E2.plugins["color_blend_modulator"] = function(core, node)
{
	this.desc = 'Color x-fader. Perform linear blend between two colors.';
	
	this.input_slots = [ 
		{ name: 'color A', dt: core.datatypes.COLOR, desc: 'First color operand.', def: core.renderer.color_black },
		{ name: 'color B', dt: core.datatypes.COLOR, desc: 'Second color operand.', def: core.renderer.color_black }, 
		{ name: 'mix', dt: core.datatypes.FLOAT, desc: '0: Emit pure color A\n1: Emit pure color B', lo: 0, hi: 1, def: 0.5 } 
	];
	
	this.output_slots = [
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Linear mix of color A and B:\n\nA * (1 - mix) + B * mix' }
	];
};

E2.p.prototype.reset = function() {
	this.output_color = new THREE.Color(1, 1, 1)
}

E2.p.prototype.update_input = function(slot, data) {
	if(slot.index === 0)
		this.color_a = data
	else if(slot.index === 1)
		this.color_b = data
	else
		this.mix = data
}

E2.p.prototype.update_state = function()
{
	var mix = this.mix;
	var inv_mix = 1.0 - mix;
	var ca = this.color_a;
	var cb = this.color_b;
	var oc = this.output_color;
	
	oc.r = (ca.r * mix) + (cb.r * inv_mix)
	oc.g = (ca.g * mix) + (cb.g * inv_mix)
	oc.b = (ca.b * mix) + (cb.b * inv_mix)
};

E2.p.prototype.update_output = function() {
	return this.output_color;
}

E2.p.prototype.state_changed = function(ui) {
	if(!ui) {
		this.color_a = new THREE.Color(0, 0, 0)
		this.color_b = new THREE.Color(0, 0, 0)
		this.output_color = new THREE.Color(0, 0, 0)
		this.mix = 0.5;
	}
};
