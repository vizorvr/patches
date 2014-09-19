E2.p = E2.plugins["url_scene_generator"] = function(core, node)
{
	this.desc = 'Load a scene from an URL. Hover over the Source button to see the url of the current file.';

	this.input_slots = [
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'Use this to load from a URL supplied as a string.', def: '' }
	];
	
	this.output_slots = [
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The loaded scene if one has been selected.' }
	];
	
	this.state = { url: '' };
	this.core = core;
	this.URL_SCENES_ROOT = 'data/scenes/';
	this.scene = null;
	this.dirty = false;
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var inp = makeButton('Source', 'No scene selected.', 'url');
	var self = this;
	
	inp.click(function()
	{
		var selected = self.state.url

		if (/scene.json$/.test(selected))
			selected = selected.replace(/\/scene.json$/, '')

		FileSelectControl
			.createForUrl(self.URL_SCENES_ROOT, selected)
			.onChange(function(v)
			{
				if (v.indexOf('://') === -1)
					v = self.URL_SCENES_ROOT + v;
				
				self.state.url = v + '/scene.json';
				self.state_changed(null);
				self.state_changed(inp);
				self.updated = true;
			});
	});

	return inp;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.state.url = data;
	this.state_changed(null);
};

E2.p.prototype.update_state = function()
{
	if(!this.dirty)
		return;
		
	if(this.scene)
		delete this.scene;
		
	this.scene = Scene.load(this.core.renderer.context, this.state.url, this.core);
	this.dirty = false;
};

E2.p.prototype.update_output = function(slot)
{
	return this.scene;
};

E2.p.prototype.state_changed = function(ui)
{
	if(this.state.url !== '')
	{
		if(ui)
			ui.attr('title', this.state.url);
		else
			this.dirty = true;
	}
};
