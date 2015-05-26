(function(){
var LightType = E2.plugins["light_type_generator"] = function(core, node)
{
	Plugin.apply(this, arguments)
	this.desc = 'Select light type.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'type', dt: core.datatypes.FLOAT, desc: 'Emits the selected light type when requested or the selection state changes.', def: 'Point' }
	];
	
	this.state = { type: Light.type.POINT };
};
LightType.prototype = Object.create(Plugin.prototype)

LightType.prototype.reset = function()
{
};

LightType.prototype.create_ui = function()
{
	var lt = Light.type;
	var inp = $('<select />', { selectedIndex: 1 });
	
	$('<option />', { value: lt.POINT, text: 'Point' }).appendTo(inp);
	$('<option />', { value: lt.DIRECTIONAL, text: 'Directional' }).appendTo(inp);
	 
	inp.change(function(self) { return function() 
	{
		self.undoableSetState('type', parseInt(inp.val()), self.state.type)
	}}(this));
	
	return inp;
};

LightType.prototype.update_output = function(slot)
{
	return this.state.type;
};

LightType.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.type);
};
})();