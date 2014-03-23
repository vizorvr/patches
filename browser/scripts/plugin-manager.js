
function PluginManager(core, base_url, creation_listener) 
{
	var self = this;

	this.base_url = base_url;
	this.core = core;
	this.keybyid = {};
	this.release_mode = false;
	this.lid = 1;
	this.context_menu = null;
	
	// First check if we're running a release build by checking for the existence
	// of 'all.plugins.js'
	var url = self.base_url + '/all.plugins.js';
	
	$.ajax({
		url: url,
		type: 'HEAD',
		async: false,
		success: function() 
		{
			msg('PluginMgr: Running in release mode');
			self.release_mode = true;
			load_script(url);
		},
		error: function()
		{
			msg('PluginMgr: Running in debug mode');
		}
	});

	this.register_plugin = function(pg_root, key, id)
	{
		self.keybyid[id] = pg_root.insert_relative(key, id);
		msg('\tLoaded ' + id + ' (' + self.lid + ')');
		self.lid++;
	};

	$.ajax({
		url: self.base_url + '/plugins.json',
		dataType: 'json',
		async: false,
		headers: {},
		success: function(data)
		{
			var pg_root = new PluginGroup('root');
			
			$.each(data, function(key, id) 
			{
				// Load the plugin, constrain filenames.
				var url = self.base_url + '/' + id + '.plugin.js';

   				if(!self.release_mode)
   				{
	   				// msg('Loading ' + id);
					load_script(url);
   				}
   				
				self.register_plugin(pg_root, key, id);
			});
			
			if(creation_listener)
				self.context_menu = new ContextMenu(E2.dom.canvas_parent, pg_root.create_items(), creation_listener);
  		}
	});
}
 
PluginManager.prototype.create = function(id, node) 
{
	if(E2.plugins.hasOwnProperty(id))
	{
		var p = new E2.plugins[id](this.core, node);
		
		p.id = id;
		
		return p;
	}
		 
	console.assert(false, 'Failed to resolve plugin with id \'' + id + '\'. Please check that the right id is specified by the plugin implementation.');
	return null;
};

