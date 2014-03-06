function PluginGroup(id)
{
	var self = this;
	
	this.id = id;
	this.children = {};
	this.entries = {};
}
	
PluginGroup.prototype.get_or_create_group = function(id)
{
	var g = this.children[id];
	
	if(!g)
	{
		g = new PluginGroup(id);
		this.children[id] = g;
	}
	
	return g;
};
	
PluginGroup.prototype.add_entry = function(name, id)
{
	var e = this.entries[name];
	
	console.assert(!e, 'Plugin keys must be unique, but a duplicate instance of the key "' + id + '" was found in plugins.json.');
	this.entries[name] = id;
};
	
PluginGroup.prototype.insert_relative = function(key, id)
{
	var tokens = key.split('/');
	
	console.assert(tokens.length > 0, 'Plugin key cannot be empty.');
	
	var g = this, len = tokens.length - 1;
	
	for(var i = 0; i < len; i++)
		g = g.get_or_create_group(tokens[i]);
	
	var key = tokens[len];
	
	g.add_entry(key, id);
	
	return key;
};
	
PluginGroup.prototype.create_items = function()
{
	var items = []
	var sorted = sort_dict(this.children);
	
	for(var i = 0, len = sorted.length; i < len; i++)
	{
		var id = sorted[i];
		var child = this.children[id];
		
		items.push({ name: id, items: child.create_items() });
		
	}
	
	sorted = sort_dict(this.entries);
	
	for(var i = 0, len = sorted.length; i < len; i++)
	{
		var id = sorted[i];
		var entry = this.entries[id];
		
		items.push({ name: id, icon: entry });
	}
		
	return items;
};

