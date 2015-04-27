(function(){
var TextureType = E2.plugins["texture_type_generator"] = function(core, node)
{
	AbstractPlugin.apply(this, arguments)
	this.desc = 'Select texture type.';
	
	this.input_slots = [];
	
	this.output_slots = [ { name: 'type', dt: core.datatypes.FLOAT, desc: 'Emits the selected texture type when requested or the selection state changes.', def: 'Diffuse color' } ];
	
	this.state = { type: Material.texture_type.DIFFUSE_COLOR };
};

TextureType.prototype = Object.create(AbstractPlugin.prototype)

TextureType.prototype.reset = function() {}

TextureType.prototype.create_ui = function()
{
	var tt = Material.texture_type;
	var inp = $('<select />', { selectedIndex: 0 });
	
	$('<option />', { value: tt.DIFFUSE_COLOR, text: 'Diffuse color' }).appendTo(inp);
	$('<option />', { value: tt.EMISSION_COLOR, text: 'Emission color' }).appendTo(inp);
	$('<option />', { value: tt.SPECULAR_COLOR, text: 'Specular color' }).appendTo(inp);
	$('<option />', { value: tt.NORMAL, text: 'Normal' }).appendTo(inp);
	 
	inp.change(function(self) { return function() 
	{
		self.undoableSetState('type', inp.val(), self.state.type)
	}}(this));
	
	return inp;
};

TextureType.prototype.update_output = function(slot)
{
	return this.state.type;
};

TextureType.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.type);
};
})();
