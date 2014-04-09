function Player(canvas, app, root_node)
{
	var self = this;
	
	this.state = {
		STOPPED: 0,
		PLAYING: 1,
		PAUSED: 2
	};

	this.app = app;
	this.core = new Core(app);
	this.interval = null;
	this.abs_time = 0.0;
	this.last_time = (new Date()).getTime();
	this.current_state = this.state.STOPPED;
	this.frames = 0;
	this.scheduled_stop = null;
	
	this.core.active_graph = this.core.root_graph = new Graph(this.core, null, root_node);
	this.core.graphs.push(this.core.root_graph);
	
	this.play = function()
	{
		this.core.root_graph.play();
		self.current_state = self.state.PLAYING;
		self.last_time = (new Date()).getTime();
		self.interval = requestAnimFrame(self.on_anim_frame);
	};
	
	this.pause = function()
	{
		self.current_state = self.state.PAUSED;
		
		if(self.interval != null)
		{
			cancelAnimFrame(self.interval);
			self.interval = null;
		}

		this.core.root_graph.pause();
	};

	this.schedule_stop = function(delegate)
	{
		this.scheduled_stop = delegate;
	};
	
	this.stop = function()
	{
		if(self.interval != null)
		{
			cancelAnimFrame(self.interval);
			self.interval = null;
		}
		
		this.core.root_graph.stop();

		self.abs_time = 0.0;
		self.frames = 0;
		self.current_state = self.state.STOPPED;
		self.core.abs_t = 0.0;

		self.core.root_graph.reset();
		self.core.renderer.begin_frame(); // Clear the WebGL view.
		self.core.renderer.end_frame();
		
		if(app && app.updateCanvas)
			app.updateCanvas(false);
	};

	this.on_anim_frame = function()
	{
		self.interval = requestAnimFrame(self.on_anim_frame);
		self.on_update();
	};

	this.on_update = function()
	{
		if(this.scheduled_stop)
		{
			this.stop();
			this.scheduled_stop();
			this.scheduled_stop = null;
			return;
		}
		
		var time = (new Date()).getTime();
		var delta_t = (time - self.last_time) * 0.001;
		
		if(self.core.update(self.abs_time, delta_t) && app.updateCanvas)
			app.updateCanvas(false);
		
		self.last_time = time;
		self.abs_time += delta_t;
		self.frames++;
	};
	
	this.select_active_graph = function()
	{
		// Select the active graph and build its UI, but only if we're not running headless.
		if(E2.dom.breadcrumb)
			self.core.onGraphSelected(self.core.active_graph);
	};
	
	this.load_from_json = function(json)
	{
		var c = self.core;
		
		c.renderer.texture_cache.clear();
		c.renderer.shader_cache.clear();
		c.deserialise(json);
		this.select_active_graph();		
		
		if(E2.app.updateCanvas)
			E2.app.updateCanvas(true);
	};
	
	this.load_from_url = function(url)
	{
		$.ajax({
			url: url,
			dataType: 'text',
			async: false,
			headers: {},
			success: function(json) 
			{
				self.load_from_json(json);
			}
		});
	};
	
	this.set_parameter = function(id, value)
	{
		this.core.root_graph.registers.write(id, value);
	};

	this.add_parameter_listener = function(id, listener)
	{
		var l = {
			register_dt_changed: function() {},
			register_updated: function(h) { return function(value) { h(value); }}(listener)
		};
		
		this.core.root_graph.registers.lock(l, id);
		return l;
	};

	this.remove_parameter_listener = function(id, listener)
	{
		this.core.registers.unlock(listerner, id);
	};

	this.select_active_graph();
}

function CreatePlayer(init_callback)
{
	$(document).ajaxError(function(e, jqxhr, settings, ex) 
	{
		if(typeof(ex) === 'string')
		{
			console.log(ex);
			return;
		}
			
		var m = 'ERROR: Script exception:\n';
		
		if(ex.fileName)
			m += '\tFilename: ' + ex.fileName;
			
		if(ex.lineNumber)
			m += '\tLine number: ' + ex.lineNumber;
		
		if(ex.message)
			m += '\tMessage: ' + ex.message;
			
		console.log(m);
	});
	
	E2.dom.webgl_canvas = $('#webgl-canvas');
	E2.app = {};
	E2.app.player = new Player(E2.dom.webgl_canvas, E2.app, null);
	
	// Block while plugins are loading...
	var wait_for_plugins = function()
	{
		var kl = Object.keys(E2.plugins).length;
		
		if(kl === E2.app.player.core.plugin_mgr.lid - 1)
			init_callback(E2.app.player);
		else 
			setTimeout(wait_for_plugins, 100);
	};
	
	wait_for_plugins();	
}
