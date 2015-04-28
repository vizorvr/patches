(function(){
var TextureWrap = E2.plugins["texture_wrap_generator"] = function(core, node)
{
	Plugin.apply(this, arguments)
	this.desc = 'Emits a texture UV coordinate wrapping type.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'type', dt: core.datatypes.FLOAT, desc: 'Emits the selected UV coordinate wrapping type when requested or the selection state changes.', def: 'Repeat' }
	];
	
	this.gl = core.renderer.context;
	
	this.state = { type: this.gl.REPEAT };
};
TextureWrap.prototype = Object.create(Plugin.prototype)

TextureWrap.prototype.reset = function()
{
};

TextureWrap.prototype.create_ui = function()
{
	var inp = $('<select />', { selectedIndex: 1 });
	
	$('<option />', { value: '' + this.gl.CLAMP_TO_EDGE, text: 'Clamp' }).appendTo(inp);
	$('<option />', { value: '' + this.gl.REPEAT, text: 'Repeat' }).appendTo(inp);
	 
	inp.change(function(self) { return function() 
	{
		self.undoableSetState('type', inp.val(), self.state.type)
	}}(this));
	
	return inp;
};

TextureWrap.prototype.update_output = function(slot)
{
	return this.state.type;
};

TextureWrap.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.type);
};
})();
