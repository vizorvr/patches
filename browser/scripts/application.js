(function() {

function Application() {
	var that = this;

	E2.app = this

	this.state = {
		STOPPED: 0,
		PLAYING: 1,
		PAUSED: 2
	};
	
	this.presetManager = new PresetManager('/presets')
	this.canvas = E2.dom.canvas;
	this.c2d = E2.dom.canvas[0].getContext('2d');
	this.editConn = null;
	this.shift_pressed = false;
	this.ctrl_pressed = false;
	this.alt_pressed = false;
	this.hover_slot = null;
	this.hover_slot_div = null;
	this.hover_connections = [];
	this.hoverNode = null;
	this.scrollOffset = [0, 0];
	this.selection_start = null;
	this.selection_end = null;
	this.selection_last = null;
	this.selectedNodes = [];
	this.selectedConnections = [];
	this.selection_dom = null;
	this.clipboard = null;
	this.inDrag = false;
	this.resize_timer = null;
	this.is_osx = /mac os x/.test(navigator.userAgent.toLowerCase());
	this.condensed_view = false;
	this.collapse_log = true;
	this.selection_border_style = '1px solid #09f';
	this.normal_border_style = 'none';
	this.is_panning = false;
	this.is_fullscreen = false;
	this._noodlesOn = true

	this._mousePosition = [400,200]

	this.undoManager = new UndoManager()
	this.graphApi = new GraphApi(this.undoManager)
	this.channel = new EditorChannel(this)

	this.dispatcher = new Flux.Dispatcher()
	this.graphStore = new GraphStore()

	// Make the UI visible now that we know that we can execute JS
	$('.nodisplay').removeClass('nodisplay');

	$('#left-nav-collapse-btn').click(function(e) {
		that.toggleLeftPane()
	})
}

Application.prototype.getNIDFromSlot = function(id) {
	return parseInt(id.slice(1, id.indexOf('s')));
}

Application.prototype.getSIDFromSlot = function(id) {
	return parseInt(id.slice(id.indexOf('s') + 2, id.length));
};

Application.prototype.offsetToCanvasCoord = function(ofs) {
	var o = [ofs.left, ofs.top];
	var co = E2.dom.canvas_parent.offset();
	var so = this.scrollOffset;
	
	o[0] -= co.left;
	o[1] -= co.top;
	o[0] += so[0];
	o[1] += so[1];
	
	return o;
};

Application.prototype.getSlotPosition = function(node, slot_div, type, result) {
	var area = node.open ? slot_div : node.ui.dom;
	var o = this.offsetToCanvasCoord(area.offset());

	result[0] = Math.round(type == E2.slot_type.input ? o[0] : o[0] + area.width() + (node.open ? 0 : 5));
	result[1] = Math.round(o[1] + (area.height() / 2));
};

Application.prototype.instantiatePlugin = function(id, pos) {
	var that = this
	var cp = E2.dom.canvas_parent
	var co = cp.offset()

	pos = pos || this._mousePosition

	function createPlugin(name) {
		var ag = that.player.core.active_graph
		var node = new Node(ag, id,
			Math.floor((pos[0] - co.left) + that.scrollOffset[0]), 
			Math.floor((pos[1] - co.top) + that.scrollOffset[1]));

		if (name) { // is graph?
			node.plugin.setGraph(new Graph(that.player.core, node.parent_graph))
			node.title = name + ' ' + node.plugin.graph.uid
			node.plugin.graph.plugin = node.plugin
		}

		that.graphApi.addNode(ag, node)

		node.reset()
	}
	
	if (id === 'graph')
		createPlugin('graph')
	else if (id === 'loop')
		createPlugin('loop')
	else
		createPlugin(null)
}

Application.prototype.activateHoverSlot = function() {
	var that = this
	var hs = this.hover_slot;
	
	if(!hs)
		return;
	
	this.hover_slot_div[0].style.backgroundColor = E2.erase_color;
	
	// Mark any attached connection
	var conns = this.player.core.active_graph.connections;
	var dirty = false;
	
	conns.some(function(c) {
		if (c.dst_slot === hs || c.src_slot === hs) {
			c.ui.deleting = true;
			that.hover_connections.push(c);
			dirty = true;
			
			if (hs.type == E2.slot_type.input)
				return true; // Early out if this is an input slot, but continue searching if it's an output slot. There might be multiple connections.
		}
	})

	if (dirty)
		this.updateCanvas(false);
}

Application.prototype.releaseHoverSlot = function() {
	if (this.hover_slot) {
		this.hover_slot_div[0].style.backgroundColor = 'inherit';
		this.hover_slot_div[0].style.color = '#000';
		this.hover_slot_div = null;
		this.hover_slot = null;
	}
	
	this.releaseHoverConnections();
}

Application.prototype.onSlotClicked = function(node, slot, slot_div, type, e) {
	e.stopPropagation()
	
	if (!this.shift_pressed) {
		var graph = this.player.core.active_graph

		if (type === E2.slot_type.output) {
			// drag new connection from output
			this.editConn = new EditConnection(
				this.graphApi,
				new Connection(node, null, slot),
				slot_div,
				null
			)

			this.getSlotPosition(node, slot_div, E2.slot_type.output, 
				this.editConn.ui.src_pos);
		
			var offset = 0;
			
			var ocs = graph.find_connections_from(node, slot);
			ocs.sort(function(a, b) {
				return a.offset < b.offset ? - 1 : a.offset > b.offset ? 1 : 0;
			})
			
			ocs.some(function(oc, i) {
				oc.offset = i;

				if (oc.offset != i) {
					offset = i;
					return true;
				}
				
				offset = i + 1;
			});
			
			this.editConn.offset = offset;
			slot_div[0].style.color = E2.COLOR_COMPATIBLE_SLOT;
		} else { // drag connection from input
			var conn = graph.find_connection_to(node, slot);
			if (!conn) {
				// new connection from input
				this.editConn = new EditConnection(
					this.graphApi,
					new Connection(null, node, null, slot), 
					null,
					slot_div)

				this.editConn.offset = 0;

				this.getSlotPosition(node, slot_div, E2.slot_type.input, 
					this.editConn.ui.src_pos);
			} else {
				this.editConn = new EditConnection(this.graphApi, conn, null, slot_div)
			}

			this.onSlotEntered(node, slot, slot_div);
		}
	} else {
		this.removeHoverConnections();
	}
			
	return false;
}

Application.prototype.onSlotEntered = function(node, slot, slot_div) {
	if (this.editConn) {
		if (this.editConn.hoverSlot(node, slot)) {
			slot_div[0].style.color = E2.COLOR_COMPATIBLE_SLOT;
		} else
			slot_div[0].style.color = E2.erase_color;
	}

	this.hover_slot = slot;
	this.hover_slot_div = slot_div;

	if (this.shift_pressed)
		this.activateHoverSlot()
}

Application.prototype.onSlotExited = function(node, slot, slot_div) {
	if (this.editConn) {
		slot_div[0].style.color = '#000';
		this.editConn.blurSlot(slot)
	}
		
	this.releaseHoverSlot();
}

Application.prototype.onMouseReleased = function() {
	var changed = false

	// Creating a connection?
	if (this.editConn) {
		var ec = this.editConn
		this.editConn = null
		var c = ec.commit()

		if (c)
			c.signal_change(true)

		if (ec.srcSlotDiv)
			ec.srcSlotDiv[0].style.color = '#000'
		if (ec.dstSlotDiv)
			ec.dstSlotDiv[0].style.color = '#000'

		changed = true
	}

	if (changed)
		this.updateCanvas(true);
	else
		E2.dom.structure.tree.on_mouse_up();

	this.releaseHoverSlot()
}

Application.prototype.updateCanvas = function(clear) {
	var c = this.c2d
	var canvas = this.canvas[0]
	 
	if (clear)
		c.clearRect(0, 0, canvas.width, canvas.height)

	var conns = this.player.core.active_graph.connections
	var cb = [[], [], [], []]
	var styles = ['#888', '#fd9720', '#09f', E2.erase_color]
	
	var connsLen = conns.length
	for (var i=0; i < connsLen; i++) {
		var cui = conns[i].ui
		// Draw inactive connections first, then connections with data flow,
		// next selected connections and finally selected connections to 
		// ensure they get rendered on top.
		cb[cui.deleting ? 3 : cui.selected ? 2 : cui.flow ? 1 : 0].push(cui.parent_conn)
	}
	
	if (this.editConn)
		cb[0].push(this.editConn.connection)
	
	var so = this.scrollOffset;
	
	c.lineWidth = 2;
	c.lineCap = 'square';
	c.lineJoin = 'miter';
	
	for(var bin = 0; bin < 4; bin++) {
		var b = cb[bin];

		if(b.length > 0) {
			c.strokeStyle = styles[bin];
			c.beginPath();
		
			for(var i = 0, len = b.length; i < len; i++) {
                // Noodles!
                var cn = b[i].ui;
                var x1 = (cn.src_pos[0] - so[0]) + 0.5;
                var y1 = (cn.src_pos[1] - so[1]) + 0.5;
                var x4 = (cn.dst_pos[0] - so[0]) + 0.5;
                var y4 = (cn.dst_pos[1] - so[1]) + 0.5;
                var diffx = Math.max(16, x4 - x1);
                var x2 = x1 + diffx * 0.5;
                var x3 = x4 - diffx * 0.5;
    
                c.moveTo(x1, y1);
                c.bezierCurveTo(x2, y1, x3, y4, x4, y4);
			}
			
			c.stroke();
		}
	}
	
	// Draw selection fence (if any)
	if (this.selection_start) {
		var ss = this.selection_start;
		var se = this.selection_end;
		var so = this.scrollOffset;
		var s = [ss[0] - so[0], ss[1] - so[1]];
		var e = [se[0] - so[0], se[1] - so[1]];
		
		c.lineWidth = 2;
		c.strokeStyle = '#09f';
		c.strokeRect(s[0], s[1], e[0] - s[0], e[1] - s[1]);
	}
}

Application.prototype.mouseEventPosToCanvasCoord = function(e, result) {
	var cp = E2.dom.canvas_parent[0];
	
	result[0] = (e.pageX - cp.offsetLeft) + this.scrollOffset[0];
	result[1] = (e.pageY - cp.offsetTop) + this.scrollOffset[1];
};

Application.prototype.releaseHoverNode = function(release_conns) {
	if (this.hoverNode !== null) {
		this.hoverNode = null
		
		if (release_conns)
			this.releaseHoverConnections()
	}
}

Application.prototype.clearHoverState = function() {
	this.hover_slot = null;
	this.hover_slot_div = null;
	this.hover_connections = [];
	this.hoverNode = null;
};

Application.prototype.clearEditState = function()
{
	this.editConn = null;
	this.shift_pressed = false;
	this.ctrl_pressed = false;
	this.clearHoverState()
};

Application.prototype.releaseHoverConnections = function() {
	this.hover_connections.map(function(hc) {
		hc.ui.deleting = false
	})

	this.hover_connections = []

	this.updateCanvas(false)
}

Application.prototype.removeHoverConnections = function() {
	this.hover_connections.map(function(connection) {
		this.graphApi.disconnect(this.player.core.active_graph, connection)
	}.bind(this))

	this.hover_connections = []
}

Application.prototype.deleteSelectedConnections = function() {
	this.selectedConnections.map(function(connection) {
		this.graphApi.disconnect(this.player.core.active_graph, connection)
	}.bind(this))

	this.hover_connections = []
}
	
Application.prototype.deleteSelectedNodes = function() {
	var that = this
	var hns = this.selectedNodes
	var ag = this.player.core.active_graph

	this.undoManager.begin('Delete nodes')

	this.releaseHoverNode(false)

	this.deleteSelectedConnections()

	hns.forEach(function(n) {
		that.graphApi.removeNode(ag, n)
	})

	this.undoManager.end('Delete nodes')

	this.clearSelection()
}

Application.prototype.onNodeHeaderEntered = function(node) {
	this.hoverNode = node
}

Application.prototype.onNodeHeaderExited = function() {
	this.releaseHoverNode(true)
}

Application.prototype.onNodeHeaderMousedown = function() {
	if (!this.hoverNode)
		return;

	var isIn = this.isNodeInSelection(this.hoverNode)
	var addNode

	if (!this.shift_pressed) {
		if (!isIn) {
			this.clearSelection()
			addNode = this.hoverNode
		}
	} else {
		if (isIn)
			this.deselectNode(this.hoverNode)
		else
			addNode = this.hoverNode
	} 

	if (addNode) {
		this.markNodeAsSelected(addNode)
		addNode.inputs.concat(addNode.outputs)
			.map(this.markConnectionAsSelected.bind(this))
	}
}

Application.prototype.onNodeHeaderClicked = function(e) {
	e.stopPropagation()
	return false
}

Application.prototype.onNodeHeaderDblClicked = function(node) {
	var that = this

	bootbox.prompt({
		animate: false,
		title: 'Rename node',
		value: node.title,
		callback: function(name) {
			if (!name)
				return;

			that.graphApi.renameNode(E2.core.active_graph, node, name)

		}
	})
}

Application.prototype.isNodeInSelection = function(node) {
	return this.selectedNodes.indexOf(node) > -1
}

Application.prototype.executeNodeDrag = function(nodes, conns, dx, dy) {
	var nl = nodes.length

	for(var i=0; i < nl; i++) {
		var node = nodes[i]
		node.x += dx
		node.y += dy

		if (!node.ui)
			continue;

		var style = node.ui.dom[0].style
		style.left = node.x + 'px'
		style.top = node.y + 'px'
	}

	var cl = conns.length
	if (cl && conns[0].ui) {
		for (var i=0; i < cl; i++)
			E2.app.redrawConnection(conns[i])
	}

	this.updateCanvas(true)
}

Application.prototype.onNodeDragged = function(node) {
	var nd = node.ui.dom[0]
	var dx = Math.floor(nd.offsetLeft) - Math.floor(node.x)
	var dy = Math.floor(nd.offsetTop) - Math.floor(node.y)

	if (!dx && !dy)
		return;

	if (!this.inDrag) {
		this.inDrag = true

		var nodes = [ node ]

		if (this.isNodeInSelection(node))
			nodes = this.selectedNodes
		
		this._dragInfo = {
			original: { x: node.x, y: node.y },
			connections: nodes.reduce(function(arr, curr) {
				return arr.concat(curr.inputs.concat(curr.outputs))
			}, [])
		}

		this.undoManager.begin('Move')
	
		this._dragInfo.nodes = nodes
	}

	this.executeNodeDrag(this._dragInfo.nodes, this._dragInfo.connections, dx, dy)
}

Application.prototype.onNodeDragStopped = function(node) {
	this.onNodeDragged(node)

	if (!this._dragInfo)
		return;

	var di = this._dragInfo
	var nd = node.ui.dom[0]
	var dx = nd.offsetLeft - di.original.x
	var dy = nd.offsetTop - di.original.y

	var cmd = new E2.commands.graph.Move(
		this.player.core.active_graph,
		di.nodes,
		dx, dy
	)

	this.undoManager.push(cmd)

	this.undoManager.end()

	this._dragInfo = null
	this.inDrag = false
}

Application.prototype.clearSelection = function() {
	var sn = this.selectedNodes;
	var sc = this.selectedConnections;
	
	for(var i = 0, len = sn.length; i < len; i++) {
		var nui = sn[i].ui;
		
		if(nui) {
			nui.selected = false;
			nui.dom[0].style.border = this.normal_border_style;
		}
	}
		
	for(var i = 0, len = sc.length; i < len; i++) {
		var cui = sc[i].ui;
		
		if(cui) 
			cui.selected = false;
	}

	this.selectedNodes = [];
	this.selectedConnections = [];
	
	this.onHideTooltip();
}

Application.prototype.redrawConnection = function(connection) {
	var gsp = this.getSlotPosition.bind(this);
	var cn = connection
	var cui = cn.ui

	gsp(cn.src_node, cui.src_slot_div, E2.slot_type.output, cui.src_pos);
	gsp(cn.dst_node, cui.dst_slot_div, E2.slot_type.input, cui.dst_pos);
}

Application.prototype.onCanvasMouseDown = function(e) {
	if (e.target.id !== 'canvas')
		return;
	
	if (e.which === 1) {
		this.selection_start = [0, 0];
		this.mouseEventPosToCanvasCoord(e, this.selection_start);
		this.selection_end = this.selection_start.slice(0);
		this.selection_last = [e.pageX, e.pageY];
		this.clearSelection();
		this.selection_dom = E2.dom.canvas_parent.find(':input').addClass('noselect'); //.attr('disabled', 'disabled');
	} else if (e.which === 2) {
		this.is_panning = true;
		this.canvas[0].style.cursor = 'move';
		e.preventDefault();
		return;
	} else {
		this.releaseSelection()
		this.clearSelection()
		E2.app.updateCanvas()
	}
	
	this.inDrag = true
	this.updateCanvas(false)
}

Application.prototype.releaseSelection = function()
{
	this.selection_start = null;
	this.selection_end = null;
	this.selection_last = null;
	
	if(this.selection_dom)
		this.selection_dom.removeClass('noselect'); // .removeAttr('disabled');
	
	this.selection_dom = null;
};

Application.prototype.onCanvasMouseUp = function(e)
{
	if(e.which === 2)
	{
		this.is_panning = false;
		this.canvas[0].style.cursor = '';
		e.preventDefault();
		return;		
	}
	
	if(!this.selection_start)
		return;
	
	this.releaseSelection();
	
	var nodes = this.selectedNodes;
	
	if(nodes.length)
	{
		var sconns = this.selectedConnections;
		
		var insert_all = function(clist)
		{
			for(var i = 0, len = clist.length; i < len; i++)
			{
				var c = clist[i];
				var found = false;
									
				for(var ci = 0, cl = sconns.length; ci < cl; ci++)
				{
					if(c === sconns[ci])
					{
						found = true;
						break;
					}
				}
		
				if(!found)
				{
					c.ui.selected = true;
					sconns.push(c);
				}
			}
		};
		
		// Select all pertinent connections
		for(var i = 0, len = nodes.length; i < len; i++)
		{
			var n = nodes[i];
		    				
			insert_all(n.inputs);
			insert_all(n.outputs);
		}
	}
	
	this.inDrag = false;
	this.updateCanvas(true);
	
	// Clear focus to prevent problems with the user dragging over text areas (bringing them in focus) during selection.
	if(document.activeElement)
			document.activeElement.blur();
};

Application.prototype.onMouseMoved = function(e)
{
	this._mousePosition = [e.pageX, e.pageY];

	if(this.is_panning)
	{
		var cp = E2.dom.canvas_parent;
		
		if(e.movementX)
		{
			cp.scrollLeft(this.scrollOffset[0]-e.movementX);
			this.scrollOffset[0] = cp.scrollLeft();
		}
		
		if(e.movementY)
		{
			cp.scrollTop(this.scrollOffset[1]-e.movementY);
			this.scrollOffset[1] = cp.scrollTop();
		}
		
		e.preventDefault();
		return;
	}
	else if(this.editConn)
	{
		var cp = E2.dom.canvas_parent;
		var pos = cp.position();
		var w = cp.width();
		var h = cp.height();
		var x2 = pos.left + w;
		var y2 = pos.top + h;
		
		if(e.pageX < pos.left)
			cp.scrollLeft(this.scrollOffset[0] - 20);
		else if(e.pageX > x2)
			cp.scrollLeft(this.scrollOffset[0] + 20);
				
		if(e.pageY < pos.top)
			cp.scrollTop(this.scrollOffset[1] - 20);
		else if(e.pageY > y2)
			cp.scrollTop(this.scrollOffset[1] + 20);

		this.mouseEventPosToCanvasCoord(e, this.editConn.ui.dst_pos);
		this.updateCanvas(true);

		return;
	}
	else if(!this.selection_start)
	{
		E2.dom.structure.tree.on_mouse_move(e);
		return;
	}
	
	if(!this.selection_end)
		return;
	
	this.mouseEventPosToCanvasCoord(e, this.selection_end);
	
	var nodes = this.player.core.active_graph.nodes;
	var cp = E2.dom.canvas_parent;
	
	var ss = this.selection_start.slice(0);
	var se = this.selection_end.slice(0);
	
	for(var i = 0; i < 2; i++)
	{
		if(se[i] < ss[i])
		{
			var t = ss[i];
		
			ss[i] = se[i];
			se[i] = t;
		}
	}
	
	var sn = this.selectedNodes;
	var ns = [];
	
	for(var i = 0, len = sn.length; i < len; i++)
		sn[i].ui.selected = false;

	for(var i = 0, len = nodes.length; i < len; i++)
	{
		var n = nodes[i],
		    nui = n.ui.dom[0],
		    p_x = nui.offsetLeft,
		    p_y = nui.offsetTop,
		    p_x2 = p_x + nui.clientWidth,
		    p_y2 = p_y + nui.clientHeight;
		    
		if(se[0] < p_x || se[1] < p_y || ss[0] > p_x2 || ss[1] > p_y2)
			continue; // No intersection.
			
		if(!n.ui.selected)
		{
			this.markNodeAsSelected(n, false);
			ns.push(n);
		}
	}
	
	for(var i = 0, len = sn.length; i < len; i++)
	{
		var n = sn[i];
		
		if(!n.ui.selected)
			n.ui.dom[0].style.border = this.normal_border_style;
	}
	
	this.selectedNodes = ns;
	
	var co = cp.offset();
	var w = cp.width();
	var h = cp.height();
	var dx = e.pageX - this.selection_last[0];
	var dy = e.pageY - this.selection_last[1];

	if((dx < 0 && e.pageX < co.left + (w * 0.15)) || (dx > 0 && e.pageX > co.left + (w * 0.85)))
		cp.scrollLeft(this.scrollOffset[0] + dx);
	
	if((dy < 0 && e.pageY < co.top + (h * 0.15)) || (dy > 0 && e.pageY > co.top + (h * 0.85)))
		cp.scrollTop(this.scrollOffset[1] + dy);
	
	this.selection_last[0] = e.pageX;
	this.selection_last[1] = e.pageY;
	
	this.updateCanvas(true);
};

Application.prototype.selectionToObject = function(nodes, conns, sx, sy) {
	var d = {};
	var x1 = 9999999.0, y1 = 9999999.0, x2 = 0, y2 = 0;

	sx = sx || 50
	sy = sy || 50

	d.nodes = [];
	d.conns = [];

	for(var i = 0, len = nodes.length; i < len; i++) {
		var n = nodes[i];
		var dom = n.ui ? n.ui.dom : null;
		var p = dom ? dom.position() : { left: n.x, top: n.y };
		var b = [p.left, p.top, p.left + (dom ? dom.width() : 0), p.top + (dom ? dom.height() : 0)]; 
		
		if(dom)
			n = n.serialise();
		
		if(b[0] < x1) x1 = b[0];
		if(b[1] < y1) y1 = b[1];
		if(b[2] > x2) x2 = b[2];
		if(b[3] > y2) y2 = b[3];
		
		d.nodes.push(n);
	}
	
	d.x1 = x1 + sx;
	d.y1 = y1 + sy;
	d.x2 = x2 + sx;
	d.y2 = y2 + sy;
	
	for(var i = 0, len = conns.length; i < len; i++) {
		var c = conns[i];
		d.conns.push(c.ui ? c.serialise() : c);
	}

	return d;
}

Application.prototype.fillCopyBuffer = function(nodes, conns, sx, sy) {
	this.clipboard = JSON.stringify(this.selectionToObject(nodes, conns, sx, sy))
	msg('Copy.')
};

Application.prototype.onDelete = function(e) {
	if (!this.selectedNodes.length)
		return;

	this.hoverNode = this.selectedNodes[0];
	this.deleteSelectedNodes();
}

Application.prototype.onCopy = function(e) {
	if (this.selectedNodes.length < 1) {
		msg('Copy: Nothing selected.');
		e.stopPropagation();
		return false;
	}
	
	this.fillCopyBuffer(this.selectedNodes, this.selectedConnections, this.scrollOffset[0], this.scrollOffset[1]);
	e.stopPropagation();
	return false;
};

Application.prototype.onCut = function(e) {
	if (this.selectedNodes.length > 0) {
		this.undoManager.begin('Cut')
		this.onCopy(e)
		this.onDelete(e)
		this.undoManager.end()
	}
}

Application.prototype.paste = function(doc, offsetX, offsetY) {
	this.undoManager.begin('Paste')

	var ag = E2.core.active_graph
	var createdNodes = []
	var createdConnections = []
	var nodeUidLookup = {}

	for(var i = 0, len = doc.nodes.length; i < len; i++) {
		var docNode = doc.nodes[i]
		var newUid = E2.core.get_uid()
console.log('paste node', docNode.uid, 'as', newUid)
		docNode.x = Math.floor((docNode.x - doc.x1) + offsetX)
		docNode.y = Math.floor((docNode.y - doc.y1) + offsetY)

		var node = new Node()
		if (!node.deserialise(ag.uid, docNode))
			continue

		nodeUidLookup[docNode.uid] = newUid
		node.uid = newUid

		this.graphApi.addNode(ag, node)

		node.patch_up(E2.core.graphs)

		createdNodes.push(node)
	}

	for(i = 0, len = doc.conns.length; i < len; i++) {
		var docConnection = doc.conns[i]
		docConnection.src_nuid = nodeUidLookup[docConnection.src_nuid]
		docConnection.dst_nuid = nodeUidLookup[docConnection.dst_nuid]
		
		var c = new Connection()
		c.deserialise(docConnection)
		
		this.graphApi.connect(ag, c)
		createdConnections.push(c)
	}
	
	for(i = 0, len = createdNodes.length; i < len; i++) {
		var node = createdNodes[i]

		node.initialise()

		if (node.plugin.reset)
			node.plugin.reset()
	}

	this.undoManager.end()

	return { nodes: createdNodes, connections: createdConnections }
}

Application.prototype.onPaste = function() {
	if (this.clipboard === null)
		return;

	this.clearSelection()

	var doc = JSON.parse(this.clipboard)
	var cp = E2.dom.canvas_parent
	var sx = this.scrollOffset[0]
	var sy = this.scrollOffset[1]

	var ox = Math.max(this._mousePosition[0] - cp.position().left + sx, 100)
	var oy = Math.max(this._mousePosition[1] - cp.position().top + sy, 100)
	
	var pasted = this.paste(doc, ox, oy)

	pasted.nodes.map(this.markNodeAsSelected.bind(this))
	pasted.connections.map(this.markConnectionAsSelected.bind(this))
}

Application.prototype.markNodeAsSelected = function(node, addToSelection) {
	node.ui.dom[0].style.border = this.selection_border_style
	node.ui.selected = true

	if (addToSelection !== false)
		this.selectedNodes.push(node)
}

Application.prototype.deselectNode = function(node) {
	this.selectedNodes.splice(this.selectedNodes.indexOf(node), 1)

	node.ui.dom[0].style.border = this.normal_border_style
	node.ui.selected = false
}

Application.prototype.markConnectionAsSelected = function(conn) {
	conn.ui.selected = true
	this.selectedConnections.push(conn)
}

Application.prototype.selectAll = function() {
	this.clearSelection()
	
	var ag = this.player.core.active_graph

	ag.nodes.map(this.markNodeAsSelected.bind(this))
	ag.connections.map(this.markConnectionAsSelected.bind(this))

	this.updateCanvas(true)
};

Application.prototype.onWindowResize = function() {
	if (E2.app.player.core.renderer.fullscreen)
		return;

	var glc = E2.dom.webgl_canvas[0];
	var canvases = $('#canvases');
	var width = canvases[0].clientWidth;
	var height = canvases[0].clientHeight

	if (glc.width !== width || glc.height !== height) {
		glc.width = width;
		glc.height = height;

		E2.dom.webgl_canvas.css('width', width);
		E2.dom.webgl_canvas.css('height', height);
		E2.dom.canvas_parent.css('width', width);
		E2.dom.canvas_parent.css('height', height);
		E2.dom.canvas[0].width = width;
		E2.dom.canvas[0].height = height;
		E2.dom.canvas.css('width', width);
		E2.dom.canvas.css('height', height);
		E2.app.player.core.renderer.update_viewport();
	}

	this.updateCanvas(true)
}

Application.prototype.toggleNoodles = function() {
	this._noodlesOn = true
	E2.dom.canvas_parent.toggle()
}

Application.prototype.toggleLeftPane = function()
{
	$('#left-nav-collapse-btn').toggleClass('fa-angle-left fa-angle-right');

	this.condensed_view = !this.condensed_view;

	E2.dom.left_nav.toggle(!this.condensed_view);
	E2.dom.mid_pane.toggle(!this.condensed_view);
	$('.resize-handle').toggle(!this.condensed_view);
	
	if(this.condensed_view)
		E2.dom.dbg.toggle(false);
	else if(!this.collapse_log)
		E2.dom.dbg.toggle(true);
	
	this.onWindowResize();
};

Application.prototype.onKeyDown = function(e) {
	var that = this

	function is_text_input_in_focus() {
		var rx = /INPUT|SELECT|TEXTAREA/i;
		var is= (rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly);
		return is
	}

	if (is_text_input_in_focus())
		return;

	if (!this._noodlesOn && e.keyCode !== 8)
		return;

/*
*/
	console.log(
		'onKeyDown', e.keyCode,
		'shift', this.shift_pressed,
		'ctrl', this.ctrl_pressed,
		'alt', this.alt_pressed
	)

	// arrow up || down
	var arrowKeys = [37,38,39,40]
	if (arrowKeys.indexOf(e.keyCode) !== -1) {
		var dx = 0, dy = 0

		if (e.keyCode === 37) dx = -10
		if (e.keyCode === 39) dx = 10
		if (e.keyCode === 38) dy = -10
		if (e.keyCode === 40) dy = 10

		if (this.selectedNodes.length) {
			that.executeNodeDrag(this.selectedNodes,
				this.selectedConnections,
				dx, dy)
		}
		e.preventDefault()
	}

	if (e.keyCode === 8 || e.keyCode === 46) { // use backspace and delete for deleting nodes
		this.onDelete(e);
		e.preventDefault();
	}
	else if(e.keyCode === 9) // tab to show/hide noodles
	{
		this.toggleNoodles()
		e.preventDefault();
	}
	else if(e.keyCode === 13) { // enter = deselect (eg. commit move)
		this.clearEditState()
		this.clearSelection()
	}
	else if(e.keyCode === 16) // .isShift doesn't work on Chrome. This does.
	{
		this.shift_pressed = true;
		this.activateHoverSlot();
	}
	else if(e.keyCode === 17) // CMD on OSX, CTRL on everything else
	{
		this.ctrl_pressed = true;
	}
	else if(e.keyCode === 18) // alt
	{
		this.alt_pressed = true;
	}
	else if(e.keyCode === 32) // space
	{
		if(this.player.current_state === this.player.state.PLAYING)
		{
			if(this.ctrl_pressed || e.metaKey)
				this.onPauseClicked();
			else
				this.onStopClicked();
		}
		else
		{
			this.onPlayClicked();
		}
		
		e.preventDefault();
		return false;
	}



	// number keys
	else if (e.keyCode > 47 && e.keyCode < 58) { // 0-9
		var numberHotKeys = [
			'plugin:output_proxy', // 0
			'plugin:input_proxy', // 1 
			'plugin:graph', // 2 
			'plugin:float_display', // 3 
			'plugin:const_float_generator', // 4
			'plugin:slider_float_generator', // 5
			'plugin:multiply_modulator', // 6
			'preset:time_oscillate_between_2_values', // 7
			'preset:image_show_image', // 8
		]

		var item = numberHotKeys[e.keyCode - 48]
		var name = item.substring(7)
		if (item.indexOf('preset:') === 0)
			that.presetManager.openPreset('/presets/'+name+'.json')
		else
			this.instantiatePlugin(name)
	}



	else if(e.keyCode === 70) // f
	{
		this.is_fullscreen = !this.is_fullscreen;
		this.player.core.renderer.set_fullscreen(this.is_fullscreen);
		e.preventDefault();
	} else if (e.keyCode === 81) { // q to focus preset search
		$('#presetSearch').focus()
		$('#presetSearch').select()
		e.preventDefault();
		return false;
	} 
	else if(this.ctrl_pressed || e.metaKey)
	{
		if(e.keyCode === 65) // CTRL+a
		{
			this.selectAll();
			e.preventDefault(); // FF uses this combo for opening the bookmarks sidebar.
			e.stopPropagation();
			return false;
		}
		if(e.keyCode === 66) // CTRL+b
		{
			this.toggleLeftPane();
			e.preventDefault(); // FF uses this combo for opening the bookmarks sidebar.
			return;
		}
		else if(e.keyCode === 76) // CTRL+l
		{
			this.collapse_log = !this.collapse_log;
			E2.dom.dbg.toggle(!this.collapse_log);
			
			if(!this.collapse_log)
				msg(null); // Update scroll position.
				
			this.onWindowResize();
			e.preventDefault();
			return;
		}

		if(e.keyCode === 67) // CTRL+c
			this.onCopy(e);
		else if(e.keyCode === 88) // CTRL+x
			this.onCut(e);
		else if(e.keyCode === 86) // CTRL+v
			this.onPaste(e);

		if (e.keyCode === 90) { // z
			e.preventDefault()
			e.stopPropagation()

			if (!this.shift_pressed)
				this.undoManager.undo()
			else
				this.undoManager.redo()
		}
	}

};

Application.prototype.onKeyUp = function(e)
{
	if(e.keyCode === 17) // CMD on OSX, CTRL on everything else
	{
		this.ctrl_pressed = false;
	}
	else if (e.keyCode === 18)
	{
		this.alt_pressed = false;
	}
	else if(e.keyCode === 16)
	{
		this.shift_pressed = false;
		this.releaseHoverSlot();
		this.releaseHoverNode(false);
	}
};

Application.prototype.changeControlState = function()
{
	var s = this.player.state;
	var cs = this.player.current_state;

	if (cs !== s.PLAYING) {
		E2.dom.play_i.removeClass('fa-pause')
		E2.dom.play_i.addClass('fa-play')
		E2.dom.stop.addClass('disabled')
	} else {
		E2.dom.play_i.removeClass('fa-play')
		E2.dom.play_i.addClass('fa-pause')
		E2.dom.stop.removeClass('disabled')
	}
}

Application.prototype.onPlayClicked = function()
{
	if (this.player.current_state === this.player.state.PLAYING)
		this.player.pause();
	else
		this.player.play();

	this.changeControlState();
};

Application.prototype.onPauseClicked = function() {
	this.player.pause()
	this.changeControlState()
}

Application.prototype.onStopClicked = function() {
	this.player.schedule_stop(this.changeControlState.bind(this))
}

Application.prototype.onOpenClicked = function() {
	FileSelectControl
		.createGraphSelector(null, 'Open', function(path) {
			history.pushState({
				graph: {
					path: path
				}
			}, '', path + '/edit')

			E2.app.midPane.closeAll()
			E2.app.loadGraph('/data/graph'+path+'.json')
		})
}

Application.prototype.loadGraph = function(graphPath)
{
	E2.app.onStopClicked();
	E2.app.player.on_update();
	E2.dom.filename_input.val(graphPath);
	E2.app.player.load_from_url(graphPath);
};

Application.prototype.onSaveAsPresetClicked = function() {
	this.openPresetSaveDialog()
}

Application.prototype.onSaveSelectionAsPresetClicked = function() {
	var graph = this.selectionToObject(this.selectedNodes, this.selectedConnections)
	this.openPresetSaveDialog(JSON.stringify({ root: graph }))
}

Application.prototype.openPresetSaveDialog = function(serializedGraph) {
	var that = this
	var username = E2.models.user.get('username')
	if (!username) {
		return E2.controllers.account.openLoginModal()
	}

	var presetsPath = '/'+username+'/presets/'

	E2.dom.load_spinner.show()

	$.get(presetsPath, function(files) {
		var fcs = new FileSelectControl()
		.frame('save-frame')
		.template('preset')
		.buttons({
			'Cancel': function() {},
			'Save': function(name) {
				if (!name)
					return bootbox.alert('Please enter a name for the preset')

				serializedGraph = serializedGraph || that.player.core.serialise()

				$.ajax({
					type: 'POST',
					url: presetsPath,
					data: {
						name: name,
						graph: serializedGraph
					},
					dataType: 'json',
					success: function(saved) {
						E2.dom.load_spinner.hide()
						that.presetManager.refresh()
					},
					error: function(x, t, err) {
						E2.dom.load_spinner.hide();

						if (x.status === 401)
							return E2.controllers.account.openLoginModal();

						if (x.responseText)
							bootbox.alert('Save failed: ' + x.responseText);
						else
							bootbox.alert('Save failed: ' + err);
					}
				});
			}
		})
		.files(files)
		.modal();
		
		return fcs;
	})
};

Application.prototype.onSaveClicked = function(cb)
{
	this.openSaveDialog();
}

Application.prototype.openSaveDialog = function(cb)
{
	var that = this

	if (!E2.models.user.get('username'))
	{
		return E2.controllers.account.openLoginModal();
	}

	E2.dom.load_spinner.show();

	$.get(URL_GRAPHS, function(files) {
		var wh = window.location.hash;
		var fcs = new FileSelectControl()
		.frame('save-frame')
		.template('graph')
		.buttons({
			'Cancel': function() {},
			'Save': function(path, tags) {
				if (!path)
					return bootbox.alert('Please enter a filename');

				var ser = that.player.core.serialise();

				$.ajax({
					type: 'POST',
					url: URL_GRAPHS,
					data: {
						path: path,
						tags: tags,
						graph: ser
					},
					dataType: 'json',
					success: function(saved)
					{
						E2.dom.load_spinner.hide();
						history.pushState({}, '', saved.path+'/edit');
						if (cb)
							cb();
					},
					error: function(x, t, err)
					{
						E2.dom.load_spinner.hide();

						if (x.status === 401)
							return E2.controllers.account.openLoginModal();

						if (x.responseText)
							bootbox.alert('Save failed: ' + x.responseText);
						else
							bootbox.alert('Save failed: ' + err);
					}
				});
			}
		})
		.files(files)
		.selected(window.location.pathname.split('/')[2])
		.modal();
		
		return fcs;
	})
}

Application.prototype.onPublishClicked = function() {
	this.openSaveDialog(function() {
		window.location.href = '//vizor.io/'+window.location.pathname.split('/').slice(1,3).join('/');
	})
}

Application.prototype.onLoadClipboardClicked = function() {
	var that = this
	var url = URL_GRAPHS + E2.dom.filename_input.val()

	$.get(url, function(d) {
		that.fillCopyBuffer(d.root.nodes, d.root.conns, 0, 0)
	})
}

Application.prototype.onShowTooltip = function(e) {
	var that = this

	if(this.inDrag)
		return false;
	
	var $elem = $(e.currentTarget);
	var tokens = $elem.attr('alt').split('_');
	var core = this.player.core;
	var node = core.active_graph.nuid_lut[parseInt(tokens[0], 10)];
	var txt = '';
	
	if(tokens.length < 2) // Node?
	{
		var p_name = core.pluginManager.keybyid[node.plugin.id];
		
		txt += '<b>' + p_name + '</b><br/><br/>' + node.plugin.desc;
	}
	else // Slot
	{
		var plugin = node.plugin;
		var slot = null;

		if(tokens[1][0] === 'd')
			slot = node.find_dynamic_slot(tokens[1][1] === 'i' ? E2.slot_type.input : E2.slot_type.output, parseInt(tokens[2], 10));
		else
			slot = (tokens[1][1] === 'i' ? plugin.input_slots : plugin.output_slots)[parseInt(tokens[2], 10)];
		
		txt = '<b>Type:</b> ' + slot.dt.name;

		if(slot.lo !== undefined || slot.hi !== undefined)
			txt += '<br /><b>Range:</b> ' + (slot.lo !== undefined ? 'min. ' + slot.lo : '') + (slot.hi !== undefined ? (slot.lo !== undefined ? ', ' : '') + 'max. ' + slot.hi : '')

		if(slot.def !== undefined)
		{
			txt += '<br /><b>Default:</b> ';
			
			if(slot.def === null)
				txt += 'Nothing';
			else if(slot.def === this.player.core.renderer.matrix_identity)
				txt += 'Identity';
			else if(slot.def === this.player.core.renderer.material_default)
				txt += 'Default material';
			else if(slot.def === this.player.core.renderer.light_default)
				txt += 'Default light';
			else if(slot.def === this.player.core.renderer.camera_screenspace)
				txt += 'Screenspace camera';
			else
			{
				var cn = slot.def.constructor.name;
				
				if(cn === 'Texture')
				{
					txt += 'Texture';
					
					if(slot.def.image && slot.def.image.src)
						txt += ' (' + slot.def.image.src + ')';
				}
				else
					txt += JSON.stringify(slot.def);
			}
		}
		
		txt += '<br /><br />';

		if(slot.desc)
			txt += slot.desc.replace(/\n/g, '<br/>');
	}
	
	clearTimeout(this._tooltipTimer);

	this._tooltipTimer = setTimeout(function() {
		if (that.inDrag)
			return;

		$elem.tooltip({
			title: txt,
			container: 'body',
			animation: false,
			trigger: 'manual',
			html: true
		})
		.tooltip('show');

		that._tooltipElem = $elem;

	}, 500);
	
};

Application.prototype.onHideTooltip = function() {
	clearTimeout(this._tooltipTimer)

	if (this._tooltipElem) {
		this._tooltipElem.tooltip('hide')
		this._tooltipElem = null
	}

	if (this.inDrag)
		return false
}


function onGraphChanged() {
	E2.app.updateCanvas(true)
}

function onNodeAdded(graph, node) {
	console.log('onNodeAdded', node, node.plugin.isGraph)
	
	if (graph === E2.core.active_graph)
		node.create_ui()

	if (node.plugin.state_changed && node.ui)
		node.plugin.state_changed(node.ui.plugin_ui)

	node.patch_up(E2.core.graphs)

	if (node.plugin.isGraph) {
		function addToTree(n) {
			if (!n.plugin.isGraph)
				return;

			n.parent_graph.tree_node
				.add_child(n.title, n.plugin.graph)

			n.plugin.graph.nodes.map(addToTree)
		}

		addToTree(node)
	}
}

function onNodeRemoved(graph, node) {
	console.log('onNodeRemoved', node)

	E2.app.onHideTooltip()

	node.destroy_ui()

	if (node.plugin.isGraph) {
		function removeFromTree(n) {
			if (!n.plugin.isGraph)
				return;

			n.plugin.graph.tree_node.remove()
			n.plugin.graph.nodes.map(removeFromTree)
		}

		removeFromTree(node)
	}
}

function onNodeRenamed(graph, node) {
	console.log('onNodeRenamed', node.title)
	if (node.ui)
		node.ui.dom.find('.t').text(node.title)
	
	if (node.plugin.isGraph)
		node.plugin.graph.tree_node.set_title(node.title)

	if (node.plugin.renamed)
		node.plugin.renamed()
}

function onConnected(graph, connection) {
	console.log('onConnected', connection, graph === E2.core.active_graph)

	if (!connection.ui)
		connection.create_ui()

	connection.ui.resolve_slot_divs()
}

function onDisconnected(graph, connection) {
	console.log('onDisconnected', connection)

	connection.destroy_ui()
}

Application.prototype.onGraphSelected = function(graph) {
	var that = this
console.log('onGraphSelected', graph)
	E2.core.active_graph.destroy_ui()

	E2.core.active_graph = graph

/*
	graph.on('changed', onGraphChanged)
	graph.on('nodeAdded', onNodeAdded)
	graph.on('nodeRemoved', onNodeRemoved)
	graph.on('nodeRenamed', onNodeRenamed)
	graph.on('connected', onConnected)
	graph.on('disconnected', onDisconnected)
*/
	E2.dom.canvas_parent.scrollTop(0)
	E2.dom.canvas_parent.scrollLeft(0)
	this.scrollOffset[0] = this.scrollOffset[1] = 0

	E2.dom.breadcrumb.children().remove()

	function buildBreadcrumb(parentEl, graph, add_handler) {
		var sp = $('<span>' + graph.tree_node.title + '</span>')
		sp.css('cursor', 'pointer')
		
		if (add_handler) {
			sp.click(function() {
				graph.tree_node.activate()
			})
			
			sp.css({ 'text-decoration': 'underline' })
		}
		
		parentEl.prepend($('<span> / </span>'))
		parentEl.prepend(sp)
		
		if (graph.parent_graph)
			buildBreadcrumb(parentEl, graph.parent_graph, true)
	}

	buildBreadcrumb(E2.dom.breadcrumb, E2.core.active_graph, false)
	
	E2.core.active_graph.create_ui()
	E2.core.active_graph.reset()
	E2.core.active_graph_dirty = true
}

Application.prototype.start = function() {
	var that = this

	this.graphStore
	.on('changed', onGraphChanged.bind(this))
	.on('nodeAdded', onNodeAdded.bind(this))
	.on('nodeRemoved', onNodeRemoved.bind(this))
	.on('nodeRenamed', onNodeRenamed.bind(this))
	.on('connected', onConnected.bind(this))
	.on('disconnected', onDisconnected.bind(this))
	.on('reordered', function() {
		E2.core.rebuild_structure_tree()
	})

	E2.core.pluginManager.on('created', this.instantiatePlugin.bind(this))

   	document.addEventListener('mouseup', this.onMouseReleased.bind(this))
	document.addEventListener('mousemove', this.onMouseMoved.bind(this))
	window.addEventListener('keydown', this.onKeyDown.bind(this))
	window.addEventListener('keyup', this.onKeyUp.bind(this))
	
	E2.dom.canvas_parent[0].addEventListener('scroll', function() {
		that.scrollOffset = [ E2.dom.canvas_parent.scrollLeft(), E2.dom.canvas_parent.scrollTop() ]
		var s = E2.dom.canvas[0].style
		
		s.left = that.scrollOffset[0] + 'px'
		s.top = that.scrollOffset[1] + 'px'

		that.updateCanvas(true)
	})
	
	E2.dom.canvas_parent[0].addEventListener('mousedown', this.onCanvasMouseDown.bind(this))
	document.addEventListener('mouseup', this.onCanvasMouseUp.bind(this))
	
	// Clear hover state on window blur. Typically when the user switches
	// to another tab.
	window.addEventListener('blur', function() {
		that.shift_pressed = false
		that.ctrl_pressed = false
		that.releaseHoverSlot()
		that.releaseHoverNode(false)
	})
	
	window.addEventListener('resize', function() {
		// To avoid UI lag, we don't respond to window resize events directly.
		// Instead, we set up a timer that gets superceeded for each (spurious)
		// resize event within a 100 ms window.
		clearTimeout(that.resize_timer)
		that.resize_timer = setTimeout(that.onWindowResize.bind(that), 100)
	})

	// close bootboxes on click 
	$(document).on('click', '.bootbox.modal.in', function(e) {
		var $et = $(e.target)
		if (!$et.parents('.modal-dialog').length)
			bootbox.hideAll()
	})

	$('button#fullscreen').click(function() {
		E2.core.renderer.set_fullscreen(true);
	});
	
	$('button#help').click(function() {
		window.open('/help/introduction.html', 'Vizor Create Help');
	});

	$('.resize-handle').on('mousedown', function(e) {
		var $handle = $(e.target)
		var $pane = $($handle.data('target'))
		var ow = $pane.width()
		var ox = e.pageX
		var $doc = $(document)
		var changed = false

		e.preventDefault()

		function mouseMoveHandler(e) {
			changed = true
			var nw = ow + (e.pageX - ox)
			e.preventDefault()
			$pane.css('flex', '0 0 '+nw+'px')
			$pane.css('width', nw+'px')
			$pane.css('max-width', nw+'px')
			E2.app.onWindowResize()
		}

		$doc.on('mousemove', mouseMoveHandler)
		$doc.one('mouseup', function(e) {
			if (!changed) {
				$pane.toggleClass('pane-hidden')
				E2.app.onWindowResize()
			}
			e.preventDefault()
			$doc.off('mousemove', mouseMoveHandler)
		})
	})

	E2.dom.save.click(E2.app.onSaveClicked.bind(E2.app))
	E2.dom.saveAsPreset.click(E2.app.onSaveAsPresetClicked.bind(E2.app))
	E2.dom.saveSelectionAsPreset.click(E2.app.onSaveSelectionAsPresetClicked.bind(E2.app))
	E2.dom.open.click(E2.app.onOpenClicked.bind(E2.app))
	E2.dom.publish.click(E2.app.onPublishClicked.bind(E2.app))

	E2.dom.play.click(E2.app.onPlayClicked.bind(E2.app))
	E2.dom.pause.click(E2.app.onPauseClicked.bind(E2.app))
	E2.dom.stop.click(E2.app.onStopClicked.bind(E2.app))

	this.midPane = new E2.MidPane()
}


E2.InitialiseEngi = function(vr_devices) {
	E2.dom.canvas_parent = $('#canvas_parent');
	E2.dom.canvas = $('#canvas');
	E2.dom.controls = $('#controls');
	E2.dom.webgl_canvas = $('#webgl-canvas');
	E2.dom.left_nav = $('#left-nav');
	E2.dom.mid_pane = $('#mid-pane');
	E2.dom.dbg = $('#dbg');
	E2.dom.play = $('#play');
	E2.dom.play_i = $('i', E2.dom.play);
	E2.dom.pause = $('#pause');
	E2.dom.stop = $('#stop');
	E2.dom.refresh = $('#refresh');
	E2.dom.save = $('.save-button');
	E2.dom.saveAsPreset = $('#save-as-preset');
	E2.dom.saveSelectionAsPreset = $('#save-selection-as-preset');
	E2.dom.publish = $('#publish');
	E2.dom.dl_graph = $('#dl-graph');
	E2.dom.open = $('#open');
	E2.dom.load_clipboard = $('#load-clipboard');
	E2.dom.structure = $('#structure');
	E2.dom.info = $('#info');
	E2.dom.info._defaultContent = E2.dom.info.html()
	E2.dom.tabs = $('#tabs');
	E2.dom.graphs_list = $('#graphs-list');
	E2.dom.presets_list = $('#presets');
	E2.dom.breadcrumb = $('#breadcrumb');
	E2.dom.load_spinner = $('#load-spinner');
	E2.dom.filename_input = $('#filename-input');

	$.ajaxSetup({ cache: false });

	E2.dom.dbg.ajaxError(function(e, jqxhr, settings, ex) {
		if(settings.dataType === 'script' && !settings.url.match(/^\/plugins\/all.plugins\.js/)) {
			if(typeof(ex) === 'string') {
				msg(ex);
				return;
			}
				
			var m = 'ERROR: Script exception:\n';
			
			if(ex.fileName)
				m += '\tFilename: ' + ex.fileName;
				
			if(ex.lineNumber)
				m += '\tLine number: ' + ex.lineNumber;
			
			if(ex.message)
				m += '\tMessage: ' + ex.message;
				
			msg(m)
		}
	})

	E2.core = new Core(vr_devices)
	E2.app = new Application()

	var player = new Player(vr_devices, E2.dom.webgl_canvas)

	E2.treeView = E2.dom.structure.tree = new TreeView(
		E2.dom.structure,
		E2.core.root_graph,
		function(graph) { // On item activation
			E2.app.clearEditState()
			E2.app.clearSelection()
			E2.app.onGraphSelected(graph)
			E2.app.updateCanvas(true)
		},
		// on graph reorder
		E2.app.graphApi.reorder.bind(E2.app.graphApi)
	)

	E2.app.player = player

	E2.core.on('ready', function() {
		console.log('CORE READY')
		E2.app.start()

		E2.app.onWindowResize()
		E2.app.onWindowResize()
		
		if (E2.core.pluginManager.release_mode) {
			window.onbeforeunload = function() {
			    return 'You might be leaving behind unsaved work!';
			}
		}
	})

}

if (typeof(module) !== 'undefined')
	module.exports = Application

})()

