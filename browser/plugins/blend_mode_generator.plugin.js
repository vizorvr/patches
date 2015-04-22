(function(){
var BlendMode = E2.plugins["blend_mode_generator"] = function(core) {
	AbstractPlugin.apply(this, arguments)
	this.desc = 'Select blend mode.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'blend mode', dt: core.datatypes.FLOAT, desc: 'Emits the selected blend mode when requested or the selection state changes.', def: 'Normal' }
	];
	
	this.state = { mode: Renderer.blend_mode.NORMAL };
};
BlendMode.prototype = Object.create(AbstractPlugin.prototype)

BlendMode.prototype.reset = function()
{
}

BlendMode.prototype.create_ui = function() {
	var that = this
	var bm = Renderer.blend_mode;
	var inp = $('<select />', { selectedIndex: 4 });
	
	$('<option />', { value: bm.NONE, text: 'None' }).appendTo(inp);
	$('<option />', { value: bm.ADDITIVE, text: 'Add' }).appendTo(inp);
	$('<option />', { value: bm.SUBTRACTIVE, text: 'Sub' }).appendTo(inp);
	$('<option />', { value: bm.MULTIPLY, text: 'Mul' }).appendTo(inp);
	$('<option />', { value: bm.NORMAL, text: 'Normal' }).appendTo(inp);
	 
	inp.change(function() {
		that.undoableSetState('mode', parseInt(inp.val()), that.state.mode)
	})
	
	return inp;
}

BlendMode.prototype.update_output = function() {
	return this.state.mode;
};

BlendMode.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.mode);
}

})();

