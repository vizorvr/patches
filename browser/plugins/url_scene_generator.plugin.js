(function(){
var UrlScene = E2.plugins.url_scene_generator = function(core, node) {
	Plugin.apply(this, arguments)
	this.desc = 'Load a scene from an URL. Hover over the Change button to see the url of the current file.';

	this.input_slots = [
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'Use this to load from a URL supplied as a string.', def: '' }
	];
	
	this.output_slots = [
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The loaded scene if one has been selected.' }
	];
	
	this.state = { url: '' };
	this.core = core;
	this.scene = null;
	this.dirty = false;
};
UrlScene.prototype = Object.create(Plugin.prototype)

UrlScene.prototype.reset = function() {}

UrlScene.prototype.create_ui = function() {
	var inp = makeButton('Change', 'No scene selected.', 'url');
	var that = this;
	
	inp.click(function() {
		var oldValue = that.state.url
		var newValue

		FileSelectControl
			.createSceneSelector(that.state.url)
			.onChange(function(v)
			{
				newValue = that.state.url = v;
				that.state_changed(null);
				that.state_changed(inp);
				that.updated = true;
			})
			.on('closed', function() {
				if (newValue === oldValue)
					return;
			
				that.undoableSetState('url', newValue, oldValue)
			})
	});

	return inp;
};

UrlScene.prototype.update_input = function(slot, data)
{
	this.state.url = data;
	this.state_changed(null);
};

UrlScene.prototype.update_state = function() {
	if(!this.dirty)
		return;
		
	if(this.scene)
		delete this.scene;

	var that = this
		
	this.scene = Scene.load(this.core.renderer.context, this.state.url, this.core, function() {
		that.updated = true
	});

	this.dirty = false;
};

UrlScene.prototype.update_output = function(slot)
{
	return this.scene;
};

UrlScene.prototype.state_changed = function(ui)
{
	if (this.state.url !== '') {
		if (ui)
			ui.attr('title', this.state.url);
		else
			this.dirty = true;
	}
};
})()