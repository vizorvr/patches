function PluginManager(a, b, c, cb)
{
	this.keybyid = E2.plugins;
	setTimeout(cb, 0);
}

PluginManager.prototype.create = function(id, node)
{
	if (E2.plugins.hasOwnProperty(id))
	{
		var p = new E2.plugins[id](E2.app.player.core, node);
		p.id = id;
		return p;
	}

	throw new Error('Failed to resolve plugin with id '+ id);
	return null;
};

