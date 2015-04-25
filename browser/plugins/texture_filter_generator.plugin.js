(function(){
var TextureFilter = E2.plugins["texture_filter_generator"] = function(core, node)
{
	AbstractPlugin.apply(this, arguments)
	this.desc = 'Emits a texture mini- and magnify filter type.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'type', dt: core.datatypes.FLOAT, desc: 'Emits the selected texture filter type when requested or the selection state changes.', def: 'Linear' }
	];
	
	this.gl = core.renderer.context;
	
	this.state = { type: this.gl.LINEAR };
};

TextureFilter.prototype = Object.create(AbstractPlugin.prototype)

TextureFilter.prototype.reset = function()
{
};

TextureFilter.prototype.create_ui = function()
{
	var inp = $('<select />', { selectedIndex: 1 });
	
	$('<option />', { value: this.gl.NEAREST, text: 'Nearest' }).appendTo(inp);
	$('<option />', { value: this.gl.LINEAR, text: 'Linear' }).appendTo(inp);
	 
	inp.change(function(self) { return function()  {
		self.undoableSetState('type', inp.val(), self.state.type)
	}}(this));
	
	return inp;
};

TextureFilter.prototype.update_output = function(slot)
{
	return this.state.type;
};

TextureFilter.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.type);
};
})();
