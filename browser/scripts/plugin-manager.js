function PluginManager(core, base_url) {
	EventEmitter.call(this)

	var that = this;

	this.base_url = base_url
	this.core = core
	this.keybyid = {}
	this.lid = 1
	this.total = 0
	this.loaded = 0
	this.failed = 0

	function loadPlugins() {
		$.ajax({
			url: that.base_url + '/plugins.json',
			cache: true,
			type: 'GET',
			success: function(data) {
				E2.core.pluginsByCategory = data

				var pg_root = new PluginGroup('root')
				
				$.each(data, function(category)  {
					if (!Vizor.releaseMode)
						that.total += Object.keys(data[category]).length

					$.each(data[category], function(title, id)  {
						var url = that.base_url + '/' + id + '.plugin.js';
						if (!Vizor.releaseMode)
							load_script(url, that.onload.bind(that), that.onerror.bind(that));
						that.register_plugin(pg_root, category+'/'+title, id);
					})
				})

				if (E2.app) {
					that.context_menu = new ContextMenu(E2.dom.canvas_parent, pg_root.create_items())
					that.context_menu.on('created', function(icon, position) {
						that.emit('created', icon, position)
					})
				}

				if (Vizor.releaseMode) {
					that.total = 1
					that.loaded = 1
					this.failed = 0
					that.update_state()
				}
			}
		})
	}

	msg('PluginMgr: Running in release mode: '+Vizor.releaseMode)

	loadPlugins()
}

PluginManager.prototype = Object.create(EventEmitter.prototype)

PluginManager.prototype.register_plugin = function(pg_root, key, id) {
	this.keybyid[id] = pg_root.insert_relative(key, id);
	// msg('\tLoaded ' + id + ' (' + this.lid + ')');
	this.lid++;
};

PluginManager.prototype.update_state = function() {
	if (this.loaded + this.failed === this.total) {
		this.emit('ready')
	}
}

PluginManager.prototype.onload = function()
{
	this.loaded++;
	this.update_state();
};

PluginManager.prototype.onerror = function()
{
	this.failed++;
	this.update_state();
};

PluginManager.prototype.create = function(id, node) 
{
	if (E2.plugins.hasOwnProperty(id)) {
		var p = new E2.plugins[id](this.core, node);
		p.id = id;
		return p;
	}
		 
	console.assert(false, 'Failed to resolve plugin with id \'' + id + '\'. Please check that the right id is specified by the plugin implementation.');

	return null;
};

if (typeof(module) !== 'undefined')
	module.exports = PluginManager
