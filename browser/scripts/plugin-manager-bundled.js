function PluginManager() {
	EventEmitter.call(this)
	this.keybyid = E2.plugins;
	var that = this
	setTimeout(function() {
		that.emit('ready')
	}, 0)
}

PluginManager.prototype = Object.create(EventEmitter.prototype)

PluginManager.prototype.create = function(id, node) {
	if (E2.plugins.hasOwnProperty(id)) {
		var p = new E2.plugins[id](E2.app.player.core, node);
		p.id = id;
		return p;
	}

	throw new Error('Failed to resolve plugin with id '+ id);
}

