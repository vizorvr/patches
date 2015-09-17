function PluginManager(core, base_url) {
	EventEmitter.call(this)

	var that = this;

	this.base_url = base_url
	this.core = core
	this.keybyid = {}
	this.release_mode = false
	this.lid = 1
	this.total = 0
	this.loaded = 0
	this.failed = 0

	var allPluginsUrl = this.base_url + '/all.plugins.js'

	function loadPlugins() {
		$.ajax({
			url: that.base_url + '/plugins.json',
			type: 'GET',
			success: function(data) {
				var pg_root = new PluginGroup('root')
				
				$.each(data, function(category)  {
					if (!that.release_mode)
						that.total += Object.keys(data[category]).length

					$.each(data[category], function(title, id)  {
						var url = that.base_url + '/' + id + '.plugin.js';
						if (!that.release_mode)
							load_script(url, that.onload.bind(that), that.onerror.bind(that));
						that.register_plugin(pg_root, category+'/'+title, id);
					})
				})

				if (that.release_mode) {
					that.total = 1
					load_script(allPluginsUrl, that.onload.bind(that), that.onerror.bind(that));
				}
			}
		})
	}

	$.ajax({
		url: allPluginsUrl,
		type: 'GET',
		cache: true,
		success: function() {
			msg('PluginMgr: Running in release mode')
			that.release_mode = true
			loadPlugins()
		},
		error: function() {
			msg('PluginMgr: Running in debug mode')
			loadPlugins()
		}
	});
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
