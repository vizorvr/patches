var app = null;
var g_Plugins = {};

function msg(msg)
{
	var d = $("#dbg");

	d.append(msg + '\n');
	d.scrollTop(d[0].scrollHeight - d.height());
}

function make(tag)
{
	return $(document.createElement(tag));
}

function make_menu_plugin(id)
{
	var li = make('li');
	
	li.addClass('menu_item');
	
	var a = make('a');
	
	li.append(a);
	a.attr('href', '#' + id);
	a.text(id);
	
	return li;
}

function PluginManager(core, base_url) {
	this.base_url = base_url;
	this.core = core;

	var self = this;
	var plugs = [ "test_float_generator",
		      "test_string_generator",
		      "test_interval_generator",
		      "test_modulator",
		      "test_emitter" ]; // TODO: Get this from a JSON file or something.
	
	var menu = make('ul');
	
	for(var i = 0; i < plugs.length; i++) {
		var id = plugs[i];
		
		// Load the plugin, constrain filenames.
		url = self.base_url + "/" + id + ".plugin.js";
		
		$.getScript(url, (function(id) { return function(data, status) {
			if(status == "success")
			{	
				menu.append(make_menu_plugin(id))
				msg("Loaded " + id);
			}
			else
				msg("Failed to load plugin '" + id + "'");
		}})(id));  	
	}
	
	$('#context_menu').append(menu);
	$('#canvas').contextMenu({ menu: "context_menu" }, app.onPluginInstantiated);
	this.create = function(id) {
		return new g_Plugins[id](self.core);
	}
}
 
function ConnectionUI()
{
	this.src_pos = [0, 0];
	this.dst_pos = [0, 0];
}

function Connection(src_node, dst_node, src_slot, dst_slot)
{
	this.src_node = src_node;
	this.dst_node = dst_node;
	this.src_slot = src_slot;
	this.dst_slot = dst_slot;
	this.ui = null;
	
	var self = this;
	
	this.create_ui = function()
	{
		self.ui = new ConnectionUI();
	};
	
	this.destroy_ui = function()
	{
		self.ui = null;
	};
}

function NodeUI(parent_node, x, y) {
	this.parent_node = parent_node;
	this.x = x;
	this.y = y;
	
	var render_slots = function(nid, col, slots, type)
	{
		for(var i = 0; i < slots.length; i++)
		{
			var s = slots[i];
			var div = make('div');
			
			div.attr('id', nid + (type == 0 ? 'si' : 'so') + i);
			div.text(s.name);
			div.addClass('pl_slot');
			div.disableSelection();
			div.definition = s;
			
			if(type == 0)
			{
				div.mouseenter(app.onSlotEntered(parent_node, div));
				div.mouseleave(app.onSlotExited(parent_node, div));
			}
			else
				div.mousedown(app.onSlotClicked(parent_node, div));
			
			col.append(div);
		}
	};
	
	this.onClick = function(e)
	{
		e.stopPropagation();
		
		// TODO: Keep track of global modifier key state, so we can delete
		// modules with CTRL + left click or something.
		
		//alert("Click!");
		return false;
	};
	
	var nid = 'n' + parent_node.uid;
	
	this.dom = make('div');
	this.dom.addClass('plugin');
	this.dom.addClass('ui-widget-content')
	this.dom.attr('id', nid);
	this.dom.mousemove(app.onMouseMoved);
	
	this.dom.css('top', '' + y + 'px');
	this.dom.css('left', '' + x + 'px');
	
	var table = make('table');
	
	table.addClass('pl_layout');
	this.dom.append(table);
	
	var h_row = make('tr');
	var h_cell = make('td');
	
	h_cell.text(parent_node.id);
	h_cell.attr('colspan', '3');
	h_cell.disableSelection();
	h_row.append(h_cell);
	h_row.addClass('pl_header');
	h_row.click(this.onClick);
	table.append(h_row);
	
	var row = make('tr');
	
	table.append(row)
	
	var input_col = make('td');
	var content_col = make('td');
	var output_col = make('td');
	
	input_col.css('text-align', 'left');
	content_col.css('width', '100%');
	output_col.css('text-align', 'right');
	
	row.append(input_col)
	row.append(content_col)
	row.append(output_col)
	
	render_slots(nid, input_col, parent_node.plugin.input_slots, 0);
	render_slots(nid, output_col, parent_node.plugin.output_slots, 1);
	
	content_col.append(parent_node.plugin.create_ui());
	
	this.dom.draggable({containment:'parent', drag: app.onNodeDragged(parent_node) });
	
	$("#canvas_parent").append(this.dom)
}

function Node(parent_graph, plugin_id, x, y) {
	var self = this;
	
	this.parent_graph = parent_graph;
	this.plugin = app.core.plugin_mgr.create(plugin_id);
	this.x = x;
	this.y = y;
	this.ui = null;
	this.id = plugin_id;
	this.uid = parent_graph.get_node_uid();
	this.rendering_state = 0;
	
	// Decorate the slots with their index to make this immediately resolvable
	// from a slot reference, allowing for faster code elsewhere.
	
	for(var i = 0; i < this.plugin.input_slots.length; i++)
		this.plugin.input_slots[i].index = i;
		
	for(var i = 0; i < this.plugin.output_slots.length; i++)
		this.plugin.output_slots[i].index = i;

	this.create_ui = function()
	{
		self.ui = new NodeUI(self, self.x, self.y);
	};
	
	this.destroy_ui = function()
	{
		if(self.ui)
			self.ui.remove();
		
		self.ui = null;
	};
	
	this.update_recursive = function(conns, delta_t)
	{
		if(self.rendering_state == 1)
			return;
		
		var uid = self.uid;
		var inputs = self.inputs = [];
		
		for(var i = 0; i < conns.length; i++) // TODO: Cache these somewhere, so we don't have to search for them.
		{
			var c = conns[i];
			
			if(c.dst_node.uid == uid)
				inputs.push(c);
		}
		
		for(var i = 0; i < inputs.length; i++)
		{
			var i = inputs[i];
			
			i.src_node.update_recursive(conns, delta_t);
			
			var value = i.src_node.plugin.update_output(i.src_slot.index);
			
			self.plugin.update_input(i.dst_slot.index, value);
		}
		
		if(self.plugin.update_state)
			self.plugin.update_state(delta_t);
	
		if(self.ui)
			self.ui.dom.css('background-color', '#0f0');
		self.rendering_state = 1;
	}
}


function Graph(parent_graph) {
	var self = this;
	
	this.parent_graph = parent_graph;
	this.nodes = [];
	this.connections = [];
	this.node_uid = 0;

	this.get_node_uid = function()
	{
		return self.node_uid++;
	};
	
	this.create_instance = function(plugin_id, x, y)
	{
		n = new Node(self, plugin_id, x, y);
		
		self.nodes.push(n);
		return n;
	};
	
	this.update = function(delta_t)
	{
		var nodes = self.nodes;
		var roots = [];
		
		for(var i = 0; i < nodes.length; i++)
		{
			var node = nodes[i];
			
			if(node.plugin.output_slots.length == 0)
				roots.push(node);
				
			node.rendering_state = 0;
		}
		
		for(var i = 0; i < roots.length; i++)
		{
			var root = roots[i];
			
			root.update_recursive(self.connections, delta_t);
		}
	};
	
	
}

function Core() {
	var self = this;
	
	this.datatypes = {
		FLOAT: { id: 0, name: 'Float' },
		STRING: { id: 1, name: 'String' },
		TEXTURE: { id: 2, name: 'Texture' }
	};
	
	this.active_graph = this.root_graph = new Graph(null);
	
	this.update = function(delta_t)
	{
		self.active_graph.update(delta_t);
	}
}

function Application() {
	var canvas = $("#canvas");
		
	this.state = {
		STOPPED: 0,
		PLAYING: 1,
		PAUSED: 2
	};
	
	this.core = new Core();
	this.canvas = canvas;
	this.c2d = canvas[0].getContext('2d');
	this.src_node = null;
	this.dst_node = null;
	this.src_slot = null;
	this.dst_slot = null;
	this.edit_conn = null;
	this.last_mouse_pos = [0, 0];
	this.current_state = this.state.STOPPED;
	this.interval = null;
	this.start_time = (new Date()).getTime();
	this.last_time = this.start_time;
	this.ctrlPressed = false;
	
	var self = this;
	
	this.getNIDFromSlot = function(id)
	{
		return parseInt(id.slice(1, id.indexOf('s')));
	};
	
	this.getSIDFromSlot = function(id)
	{
		return parseInt(id.slice(id.indexOf('s') + 2, id.length));
	};
	
	this.getSlotPosition = function(slot, type)
	{
		var o = slot.offset();
		var co = canvas.offset();
		var x = type == 0 ? (o.left - co.left) : (o.left - co.left) + slot.width();
		
		return [x, (o.top - co.top) + (slot.height() / 2)];
	};
	
	this.mapActiveNodes = function(delegate)
	{
		var nodes = self.core.active_graph.nodes;
		
		for(var i = 0; i < nodes.length; i++)
			delegate(nodes[i]);
	};

	this.onPluginInstantiated = function(action, el, pos)
	{	
		var node = self.core.active_graph.create_instance(action, pos.docX, pos.docY);
		
		node.create_ui();
	};
	
	this.onSlotClicked = function(node, slot) { return function(e)
	{
		e.stopPropagation();
		
		self.src_node = node;
		self.src_slot = slot;
		self.edit_conn = new Connection(null, null, null, null);
		self.edit_conn.create_ui();
		self.edit_conn.ui.src_pos = self.getSlotPosition(self.src_slot, 1);
		
		slot.css('color', '#0f0');
		
		return false;
	}};

	this.onSlotEntered = function(node, slot) { return function(e)
	{
		if(self.src_slot)
		{
			if(self.src_slot.definition.dt === slot.definition.dt && !slot.is_connected) // Only allow connection if datatypes match and slot is unconnected.
			{
				self.dst_node = node;
				self.dst_slot = slot;
				slot.css('color', '#0f0');
			}
			else
			{
				self.dst_node = null;
				self.dst_slot = null;
				slot.css('color', '#f00');
			}
		}
	}};

	this.onSlotExited = function(node, slot) { return function(e)
	{
		slot.css('color', '#000');
		
		if(self.dst_node === node)
			self.dst_node = null;

		if(self.dst_slot === slot)
			self.dst_slot = null;
	}};
	
	this.drawConnection = function(c2d, conn)
	{
		var c = conn.ui;
		
		/*c2d.moveTo(c.src_pos[0], c.src_pos[1]);
		c2d.lineTo(c.dst_pos[0], c.dst_pos[1]);
		c2d.stroke();*/
		
		/*var x1 = c.src_pos[0];
		var y1 = c.src_pos[1];
		var x4 = c.dst_pos[0];
		var y4 = c.dst_pos[1];
		var diffx = Math.max(16, x4 - x1);
		var x2 = x1 + diffx * 0.5;
		var x3 = x4 - diffx * 0.5;
		
		c2d.beginPath();
		c2d.moveTo(x1, y1);
		c2d.bezierCurveTo(x2, y1, x3, y4, x4, y4);
		c2d.stroke();*/
	
		var x1 = c.src_pos[0];
		var y1 = c.src_pos[1];
		var x4 = c.dst_pos[0];
		var y4 = c.dst_pos[1];

		var mx = (x1 + x4) / 2;
		var my = (y1 + y4) / 2;
	
		var x2 = Math.min(x1 + 10, mx);
		
		c2d.beginPath();
		c2d.moveTo(x1, y1);
		c2d.lineTo(x2, y1);
		c2d.lineTo(x2, y4);
		c2d.lineTo(x4, y4);
		c2d.stroke();
	};
	
	this.updateCanvas = function()
	{
		var c = self.c2d;
		
		/*c.fillStyle = '#ccc';
		c.fillRect(0, 0, self.canvas.width(), self.canvas.height());*/
		// c.clearRect(0, 0, self.canvas[0].width, self.canvas[0].height);
		self.canvas[0].width = self.canvas[0].width; // This works, but the above does not (FF 7)
		
		c.stokeStyle = '#000';
		
		var conns = self.core.active_graph.connections;
		
		for(var i = 0; i < conns.length; i++)
			self.drawConnection(c, conns[i]);
		
		if(self.edit_conn)
		{
			var c_o = self.canvas.offset();
			var m_r = [self.last_mouse_pos[0] - c_o.left, self.last_mouse_pos[1] - c_o.top];
		
			self.edit_conn.ui.dst_pos = m_r.slice(0);
			self.drawConnection(c, self.edit_conn);
		}
	};
	
	this.onMouseMoved = function(e)
	{
		if(self.src_slot)
			self.updateCanvas();
			
		self.last_mouse_pos = [e.pageX, e.pageY];
	};
	
	this.onMouseReleased = function(e)
	{
		if(self.dst_slot) // If dest_slot is set, we should create a permanent connection.
		{
			/*var sn = $('#n' + self.getNIDFromSlot(self.source_slot.attr('id')));
			var dn = $('#n' + self.getNIDFromSlot(self.dest_slot.attr('id')));*/
			var ss = self.src_slot;
			var ds = self.dst_slot;
			var c = new Connection(self.src_node, self.dst_node, ss, ds);
			
			c.create_ui();
			c.ui.src_pos = self.edit_conn.ui.src_pos.slice(0);
			c.ui.dst_pos = self.getSlotPosition(ds);
			
			self.core.active_graph.connections.push(c);
			
			self.dst_slot.css('color', '#000');
			self.dst_slot.is_connected = true;
			self.dst_slot = null;
		}

		if(self.src_slot)
		{
			self.src_slot.css('color', '#000');
			self.src_slot = null;
		}
		
		self.dst_node = null;
		self.src_node = null;
		self.edit_conn = null;
		self.updateCanvas();
	};

	this.onNodeDragged = function(node) { return function(e)
	{
		var conns = self.core.active_graph.connections;
		var uid = node.uid;
		var canvas_dirty = false;
		
		for(var i = 0; i < conns.length; i++)
		{
			var c = conns[i];
			
			if(c.src_node.uid == uid)
			{
				c.ui.src_pos = self.getSlotPosition(c.src_slot, 1);
				canvas_dirty = true;
			}
			else if(c.dst_node.uid == uid)
			{
				c.ui.dst_pos = self.getSlotPosition(c.dst_slot, 0);
				canvas_dirty = true;
			}
		}
		
		if(canvas_dirty)
			self.updateCanvas();
	}};
	
	this.onKeyPressed = function(e)
	{
		if(e.controlKey)
			self.ctrlPressed = true;
	};
	
	this.onKeyReleased = function(e)
	{
		if(e.controlKey)
			self.ctrlPressed = false;
	};

	this.changeControlState = function()
	{
		var cs = self.current_state;
		
		$('#play').button(cs == self.state.PLAYING ? 'disable' : 'enable');
		$('#pause').button(cs == self.state.PAUSED || cs == self.state.STOPPED ? 'disable' : 'enable');
		$('#stop').button(cs == self.state.STOPPED ? 'disable' : 'enable');
	}
	
	this.onPlayClicked = function()
	{
		self.current_state = self.state.PLAYING;
		self.changeControlState();
		
		self.start_time = (new Date()).getTime();
		self.last_time = self.start_time;
		self.interval = setInterval(function() {
			app.onUpdate();
		}, 0);
	};
	
	this.onPauseClicked = function()
	{
		self.current_state = self.state.PAUSED;
		self.changeControlState();
		
		if(self.interval != null)
		{
			clearInterval(self.interval);
			self.interval = null;
		}
	};

	this.onStopClicked = function()
	{
		self.current_state = self.state.STOPPED;
		self.changeControlState();
		
		if(self.interval != null)
		{
			clearInterval(self.interval);
			self.interval = null;
		}
	};

	this.onUpdate = function()
	{
		var time = (new Date()).getTime();
		var delta_t = (time - self.last_time) * 0.001;
		
		self.core.update(delta_t);
		$('#frame').val(delta_t.toFixed(4));
		self.last_time = time;
	}
	
	$(document).mouseup(this.onMouseReleased);
	$(document).keydown(this.onKeyPressed);
	$(document).keyup(this.onKeyReleased);
	canvas.mousemove(this.onMouseMoved);
}

$(document).ready(function() {
	$.ajaxSetup({ cache: false });
	
	$.fn.extend({ disableSelection: function() { 
			this.each(function() { 
				if (typeof this.onselectstart != 'undefined') {
					this.onselectstart = function() { return false; };
				} else if (typeof this.style.MozUserSelect != 'undefined') {
					this.style.MozUserSelect = 'none';
				} else {
					this.onmousedown = function() { return false; };
				}
			}); 
		} 
	});

	msg("Welcome to WebFx. " + (new Date()));
	
	$("#dbg").ajaxError(function(e, jqxhr, settings, exception) {
		if(settings.dataType=='script') {
			msg(e + exception);
		}
	});

	app = new Application();
	app.core.plugin_mgr = new PluginManager(app.core, 'plugins');
	
	$('#play').button({ icons: { primary: "ui-icon-play" } }).click(app.onPlayClicked);
	$('#pause').button({ icons: { primary: "ui-icon-pause" }, disabled: true }).click(app.onPauseClicked);
	$('#stop').button({ icons: { primary: "ui-icon-stop" }, disabled: true }).click(app.onStopClicked);

	$("#structure")
		.jstree({
			// the `plugins` array allows you to configure the active plugins on this instance
			"plugins" : ["themes","html_data","ui","crrm","hotkeys"],
			// each plugin you have included can have its own config object
			// "core" : { "initially_open" : [ "phtml_1" ] }
		})
		.bind("loaded.jstree", function (event, data) {
			// you get two params - event & data - check the core docs for a detailed description
		});

  	msg("Ready.");
	
	$('#content').css('display', 'block');
});
