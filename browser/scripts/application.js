(function() {

function getChannelFromPath(pathname) {
	var p = pathname.split('/')

	if (p.length > 2)
		return p[1] + '/' + p[2]

	return p[1]
}

function isPublishedGraph(path) {
	return path.split('/').length > 1
}

function Application() {
	var that = this;

	E2.app = this

	this.state = {
		STOPPED: 0,
		PLAYING: 1,
		PAUSED: 2
	}

	this.canvas = E2.dom.canvas;
	this.breadcrumb = null;
	this.c2d = E2.dom.canvas[0].getContext('2d');
	this.editConn = null;
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
	this.inDrag = false;
	this.resize_timer = null;
	this.is_osx = /mac os x/.test(navigator.userAgent.toLowerCase());
	this.condensed_view = false;
	this.collapse_log = true;
	this.selection_border_style = '1px solid #09f';
	this.normal_border_style = 'none';
	this.is_panning = false;
	this.noodlesVisible = false
	this.mousePosition = [400,200]
	this.path = getChannelFromPath(window.location.pathname)
	this.dispatcher = new Flux.Dispatcher()
	this.undoManager = new UndoManager()
	this.graphApi = new GraphApi(this.undoManager)
	
	this.graphStore = new GraphStore()
	this.peopleStore = new PeopleStore()
	
	this.peopleManager = new PeopleManager(this.peopleStore, $('#peopleTab'))

	// Make the UI visible now that we know that we can execute JS
	$('.nodisplay').removeClass('nodisplay');
	
}

Application.prototype.getNIDFromSlot = function(id) {
	return id.slice(1, id.indexOf('s'));
}

Application.prototype.getSIDFromSlot = function(id) {
	return id.slice(id.indexOf('s') + 2, id.length);
}

Application.prototype.offsetToCanvasCoord = function(ofs) {
	var o = [ofs.left, ofs.top];
	var co = E2.dom.canvas_parent.offset();
	var so = this.scrollOffset;

	o[0] -= co.left;
	o[1] -= co.top;

	o[0] += so[0];
	o[1] += so[1];

	return o;
}

Application.prototype.getSlotPosition = function(node, slot_div, type, result) {
	var area = node.open ? slot_div : node.ui.dom;
	if (!area) return false;
	var areaOffset = area.offset();
	if (!areaOffset) return false;
	var o = this.offsetToCanvasCoord(areaOffset);

	result[0] = Math.round(type === E2.slot_type.input ? o[0] : o[0] + area.width() + (node.open ? 0 : 5));
	result[1] = Math.round(o[1] + (area.height() / 2));
}

Application.prototype.createPlugin = function(id, position) {
	position = position || this.mousePosition

	function _create(name) {
		var activeGraph = E2.core.active_graph

		var node = new Node(activeGraph, id, position[0], position[1]);

		if (E2.GRAPH_NODES.indexOf(id) !== -1) { // is graph?
			node.plugin.setGraph(new Graph(E2.core, activeGraph))
			node.plugin.graph.plugin = node.plugin
		}

		if (name)
			node.title = name

		return node
	}

	switch(id) {
		case 'graph':
			return _create('Nested Patch')
		case 'loop':
			return _create('Loop')
		case 'array_function':
			return _create('Array Function')
		case 'spawner':
			return _create('Spawner')
		default:
			return _create()
	}

}

Application.prototype.setActiveGraph = function(graph) {
	if (E2.core.active_graph === graph)
		return;

	E2.app.dispatcher.dispatch({
		actionType: 'uiActiveGraphChanged',
		activeGraphUid: graph.uid
	})

	if (graph.tree_node) {
		graph.tree_node.activate()
	}
}

Application.prototype.instantiatePlugin = function(id, position) {
	position = position || this.mousePosition
	var newX = Math.floor(position[0] + this.scrollOffset[0])
	var newY = Math.floor(position[1] + this.scrollOffset[1])
	var node = this.createPlugin(id, [newX, newY])

	E2.track({
		event: 'nodeAdded', 
		id: id
	})

	this.graphApi.addNode(E2.core.active_graph, node)
	return node
}

Application.prototype.activateHoverSlot = function() {
	var that = this
	var hs = this.hover_slot;

	if(!hs)
		return true;

	// Mark any attached connection
	var conns = E2.core.active_graph.connections;
	var dirty = false;

	conns.some(function(c) {
		if (c.dst_slot === hs || c.src_slot === hs) {
			c.ui.deleting = true;
			that.hover_connections.push(c);
			dirty = true;

			if (hs.type === E2.slot_type.input)
				return true; // Early out if this is an input slot, but continue searching if it's an output slot. There might be multiple connections.
		}
	})

	if (dirty)
		this.updateCanvas(false);
	return true;
}

Application.prototype.releaseHoverSlot = function() {
	if (this.hover_slot) {
		this.setSlotCssClasses(this.hover_slot, this.hover_slot_div);
		this.hover_slot_div = null;
		this.hover_slot = null;
	}

	this.releaseHoverConnections();
	return true;
}

Application.prototype.setSlotCssClasses = function(slot, slot_div) {	/* @var slot_div jQuery */
	if (typeof slot_div === 'undefined') return false;
	if (!slot_div) return false;

	if (slot_div !== this.hover_slot_div)
		slot_div.removeClass('p_connecting')

	slot_div.removeClass('p_compatible')
			.removeClass('p_incompatible');

	if (slot && slot.is_connected)
		slot_div.addClass('p_connected')
	else
		slot_div.removeClass('p_connected');

	return true;
}

Application.prototype.onSlotClicked = function(node, slot, slot_div, type, e) {
	e.stopPropagation()

	if(document.activeElement)
			document.activeElement.blur();
	if (!E2.ui.flags.pressedShift) {
		var graph = E2.core.active_graph

		if (type === E2.slot_type.output) {
			// drag new connection from output
			this.editConn = new EditConnection(
				this.graphApi,
				new Connection(node, null, slot),
				slot_div,
				null
			)

			slot_div.addClass('p_connecting');
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

				slot_div.addClass('p_connecting');

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
		if (this.editConn.hoverSlot(node, slot)) {	// returns canConnectTo()
			slot_div.removeClass('p_incompatible').addClass('p_compatible');
		} else {
			slot_div.removeClass('p_compatible').addClass('p_incompatible');
		}
	}

	this.hover_slot = slot;
	this.hover_slot_div = slot_div;

	if (E2.ui.flags.pressedShift)
		this.activateHoverSlot()

	return true;
}

Application.prototype.onSlotExited = function(node, slot, slot_div) {
	if (this.editConn) {
		this.editConn.blurSlot(slot)
	}
	this.setSlotCssClasses(slot, slot_div);
	this.releaseHoverSlot();
	return true;
}

Application.prototype.onLocalConnectionChanged = function(connection) {
	if (connection.dst_node && connection.dst_node.plugin &&
		connection.dst_node.plugin.lsg)
		connection.dst_node.plugin.lsg.updateFreeSlots()

	if (connection.src_node && connection.src_node.plugin &&
		connection.src_node.plugin.lsg)
		connection.src_node.plugin.lsg.updateFreeSlots()
}

Application.prototype.onMouseReleased = function() {
	var changed = false

	// Creating a connection?
	if (this.editConn) {
		var ec = this.editConn

		this.editConn = null

		ec.commit()

		if (ec.srcSlotDiv)
			this.setSlotCssClasses(ec.srcSlot, ec.srcSlotDiv);

		if (ec.dstSlotDiv)
			this.setSlotCssClasses(ec.dstSlot, ec.dstSlotDiv);

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

	var conns = E2.core.active_graph.connections
	var cb = [[], [], [], []]
	var styles = ['#888', '#fd9720', '#09f', E2.erase_color]

	var connsLen = conns.length
	for (var i=0; i < connsLen; i++) {
		var cui = conns[i].ui
		if (!cui) {
			return console.error('Connection', i, 'from', 
				conns[i].src_node.uid, 'to',
				conns[i].dst_node.uid, 'has no UI')
		}

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
	var cp = E2.dom.canvases[0];

	result[0] = (e.pageX - cp.offsetLeft) + this.scrollOffset[0];
	result[1] = (e.pageY - cp.offsetTop) + this.scrollOffset[1];
}

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
}

Application.prototype.clearEditState = function()
{
	this.editConn = null;
	this.clearHoverState()
}

Application.prototype.releaseHoverConnections = function() {
	this.hover_connections.map(function(hc) {
		hc.ui.deleting = false
	})

	this.hover_connections = []

	this.updateCanvas(false)
}

Application.prototype.removeHoverConnections = function() {
	this.hover_connections.map(function(connection) {
		this.graphApi.disconnect(E2.core.active_graph, connection)
	}.bind(this))

	this.hover_connections = []
}

Application.prototype.deleteSelectedConnections = function() {
	this.selectedConnections.map(function(connection) {
		this.graphApi.disconnect(E2.core.active_graph, connection)
	}.bind(this))

	this.hover_connections = []
}

Application.prototype.deleteSelectedNodes = function() {
	var that = this
	var hns = this.selectedNodes
	var ag = E2.core.active_graph

	this.undoManager.begin('Delete nodes')

	this.releaseHoverNode(false)

	this.deleteSelectedConnections()

	hns.forEach(function(n) {
		that.graphApi.removeNode(n.parent_graph, n)
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

	if (!E2.ui.flags.pressedShift) {
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
		addNode.getConnections().map(this.markConnectionAsSelected.bind(this))
	}
}

Application.prototype.onNodeHeaderClicked = function() {
}

Application.prototype.onNodeHeaderDblClicked = function(node) {

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
		node.ui.setPosition(node.x,node.y);
	}

	var cl = conns.length
	var changed = false // eg. if not active graph

	if (cl && conns[0].ui) {
		changed = true

		for (var i=0; i < cl; i++) {
			E2.app.redrawConnection(conns[i])
		}
	}

	if (changed)
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
				return arr.concat(curr.getConnections())
			}, [])
		}

		this.undoManager.begin('Move')

		this._dragInfo.nodes = nodes
	}

	if (this._dragInfo)
		this.executeNodeDrag(this._dragInfo.nodes, this._dragInfo.connections, dx, dy)
}

Application.prototype.onNodeDragStopped = function(node) {
	this.onNodeDragged(node)

	if (!this._dragInfo) {
		this.inDrag = false
		return;
	}

	var di = this._dragInfo
	var nd = node.ui.dom[0]
	var dx = nd.offsetLeft - di.original.x
	var dy = nd.offsetTop - di.original.y

	var cmd = new E2.commands.graph.Move(
		E2.core.active_graph,
		di.nodes,
		dx, dy
	)

	this.undoManager.push(cmd)
	this.undoManager.end()

	this._dragInfo = null
	this.inDrag = false

	E2.app.channel.send({
		actionType: 'uiNodesMoved',
		graphUid: E2.core.active_graph.uid,
		nodeUids: di.nodes.map(function(n) { return n.uid }),
		delta: { x: dx, y: dy }
	})
}

Application.prototype.redrawConnection = function(connection) {	/* @TODO: rename this method */
	var cn = connection
	if (!cn.ui) {
		console.warn('redrawConnection but no ui for ' + cn.uid);
		return;
	}
	var cui = cn.ui

	this.getSlotPosition(cn.src_node, cui.src_slot_div, E2.slot_type.output, cui.src_pos);
	this.getSlotPosition(cn.dst_node, cui.dst_slot_div, E2.slot_type.input, cui.dst_pos);
}

Application.prototype.onCanvasMouseDown = function(e) {
	if (e.target.id !== 'canvas')
		return;

	e.stopPropagation()
	e.preventDefault()

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

	this.updateCanvas(false)
}

Application.prototype.releaseSelection = function() {
	this.selection_start = null;
	this.selection_end = null;
	this.selection_last = null;
	E2.ui.state.selectedObjects = this.selectedNodes

	if(this.selection_dom)
		this.selection_dom.removeClass('noselect'); // .removeAttr('disabled');

	this.selection_dom = null;
}

Application.prototype.onCanvasMouseUp = function(e) {
	if (e.which === 2) {
		this.is_panning = false;
		this.canvas[0].style.cursor = '';
		e.preventDefault();
		return;
	}

	if (!this.selection_start)
		return;

	this.releaseSelection();

	var nodes = this.selectedNodes;

	if (nodes.length) {
		var sconns = this.selectedConnections;

		var insert_all = function(clist) {
			for(var i = 0, len = clist.length; i < len; i++) {
				var c = clist[i];
				var found = false;

				for(var ci = 0, cl = sconns.length; ci < cl; ci++) {
					if (c === sconns[ci]) {
						found = true;
						break;
					}
				}

				if (!found) {
					c.ui.selected = true;
					sconns.push(c);
				}
			}
		}

		// Select all pertinent connections
		for(var i = 0, len = nodes.length; i < len; i++) {
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
}

Application.prototype.onMouseMoved = function(e) {
	this.mousePosition = [e.pageX, e.pageY];

	if(this.is_panning) {
		var cp = E2.dom.canvas_parent

		if(e.movementX) {
			cp.scrollLeft(this.scrollOffset[0]-e.movementX)
			this.scrollOffset[0] = cp.scrollLeft()
		}

		if(e.movementY) {
			cp.scrollTop(this.scrollOffset[1]-e.movementY)
			this.scrollOffset[1] = cp.scrollTop()
		}

		e.preventDefault()
		return
	} else if(this.editConn) {
		var cp = E2.dom.canvas_parent
		var pos = cp.position()
		var w = cp.width()
		var h = cp.height()
		var x2 = pos.left + w
		var y2 = pos.top + h

		if(e.pageX < pos.left)
			cp.scrollLeft(this.scrollOffset[0] - 20)
		else if(e.pageX > x2)
			cp.scrollLeft(this.scrollOffset[0] + 20)

		if(e.pageY < pos.top)
			cp.scrollTop(this.scrollOffset[1] - 20)
		else if(e.pageY > y2)
			cp.scrollTop(this.scrollOffset[1] + 20)

		this.mouseEventPosToCanvasCoord(e, this.editConn.ui.dst_pos)
		this.updateCanvas(true)

		return
	} else if(!this.selection_start) {
		E2.dom.structure.tree.on_mouse_move(e)
		return
	}

	if (this.selection_end)
		return this._performSelection(e)
}

Application.prototype._performSelection = function(e) {
	this.mouseEventPosToCanvasCoord(e, this.selection_end)

	var nodes = E2.core.active_graph.nodes
	var cp = E2.dom.canvas_parent

	var ss = this.selection_start.slice(0)
	var se = this.selection_end.slice(0)

	for(var i = 0; i < 2; i++) {
		if (se[i] < ss[i]) {
			var t = ss[i]
			ss[i] = se[i]
			se[i] = t
		}
	}

	var sn = this.selectedNodes
	var ns = []

	for(var i = 0, len = sn.length; i < len; i++)
		sn[i].ui.setSelected(false);

	for(var i = 0, len = nodes.length; i < len; i++) {
		var n = nodes[i]
		if (n && (typeof n.ui === 'undefined')) continue; // recover, should a node ref ever break..
		var nui = n.ui.dom[0]
		var p_x = nui.offsetLeft
		var p_y = nui.offsetTop
		var p_x2 = p_x + nui.clientWidth
		var p_y2 = p_y + nui.clientHeight

		if (se[0] < p_x || se[1] < p_y || ss[0] > p_x2 || ss[1] > p_y2)
			continue; // No intersection.

		if (!n.ui.selected) 	{
			this.markNodeAsSelected(n, false)
			ns.push(n)
		}
	}

	for(var i = 0, len = sn.length; i < len; i++) {
		var n = sn[i]

		if (!n.ui.selected) n.ui.setSelected(false);
	}

	this.selectedNodes = ns

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
}

Application.prototype.selectionToObject = function(nodes, conns, sx, sy) {
	var d = {}
	var x1 = 9999999.0, y1 = 9999999.0, x2 = 0, y2 = 0;

	sx = sx || 50
	sy = sy || 50

	d.nodes = [];
	d.conns = [];

	var domHasValidDimensions = true

	for(var i = 0, len = nodes.length; i < len; i++) {
		var n = nodes[i];
		var dom = n.ui ? n.ui.dom : null;

		domHasValidDimensions = domHasValidDimensions && (dom ? true : false)
		if (domHasValidDimensions && dom.position().left === 0 && dom.position().top === 0 && dom.width() === 0 && dom.height() === 0) {
			// dom is there but not visible (graph is hidden), use default dimensions instead
			domHasValidDimensions = false
		}

		var p, width, height

		if (domHasValidDimensions) {
			p = dom.position()
			width = dom.width()
			height = dom.height()
		}
		else {
			// defaults
			p = { left: n.x, top: n.y }
			width = 100
			height = 20
		}

		var b = [p.left, p.top, p.left + width, p.top + height];

		// n = n.serialise();

		if (b[0] < x1) x1 = b[0];
		if (b[1] < y1) y1 = b[1];
		if (b[2] > x2) x2 = b[2];
		if (b[3] > y2) y2 = b[3];

		d.nodes.push(n.serialise());
	}

	if (domHasValidDimensions) {
		d.x1 = x1 + sx;
		d.y1 = y1 + sy;
		d.x2 = x2 + sx;
		d.y2 = y2 + sy;
	}
	else {
		d.x1 = x1
		d.y1 = y1
		d.x2 = x2
		d.y2 = y2
	}

	for(var i = 0, len = conns.length; i < len; i++) {
		var c = conns[i];
		d.conns.push(c.serialise())
	}

	return d
}

Application.prototype.stringifyNodesAndConnections = function(nodes, conns, sx, sy) {
	return JSON.stringify(
		this.selectionToObject(nodes, conns, sx, sy)
	)
}

Application.prototype.onDelete = function(e) {
	if (E2.ui.isInProgramMode() && !this.selectedNodes.length)
		return;

	this.hoverNode = this.selectedNodes[0]

	if (this.isWorldEditorActive()) {
		var sn = this.worldEditor.selectedEntityNode
		this.setActiveGraph(this.worldEditor.selectedEntityPatch.parent_graph)
		this.selectedNodes = []
		this.selectedConnections = sn.outputs.concat(sn.inputs)
		this.markNodeAsSelected(sn)
		this.worldEditor.onDelete(this.selectedNodes)
	}

	this.deleteSelectedNodes()
}

Application.prototype.stringifySelection = function() {
	return this.stringifyNodesAndConnections(
		this.selectedNodes,
		this.selectedConnections,
		this.scrollOffset[0],
		this.scrollOffset[1])
}

Application.prototype.onCopy = function(e) {
	if (e)
		e.preventDefault()

	if (this.selectedNodes.length < 1) {
		msg('Copy: Nothing selected.')

		return false
	}

	var data = this.stringifySelection()
	
	this.clipboard = data
	
	if (e && e.clipboardData)
		e.clipboardData.setData('text/plain', data)

	return false
}

Application.prototype.onCut = function(e) {
	if (this.selectedNodes.length > 0) {
		this.undoManager.begin('Cut')
		this.onCopy(e)
		this.onDelete(e)
		this.undoManager.end()
	}
}

Application.prototype.onPaste = function(json) {
	this.clearSelection()

	json = json || this.clipboard
	var doc = JSON.parse(json)

	if (doc.root)
		doc = doc.root

	var cp = E2.dom.canvases
	var sx = this.scrollOffset[0]
	var sy = this.scrollOffset[1]

	// pasted node bbox: doc.x1, doc.y1 - doc.x2, doc.y2

	var ox = Math.max(this.mousePosition[0] - cp.position().left + sx, 100)
	var oy = Math.max(this.mousePosition[1] - cp.position().top + sy, 100)

	var pasted = this.paste(doc, ox, oy)

	pasted.nodes.map(this.markNodeAsSelected.bind(this))
	pasted.connections.map(this.markConnectionAsSelected.bind(this))

	return pasted
}

Application.prototype.paste = function(srcDoc, offsetX, offsetY) {
	return this.pasteInGraph(E2.core.active_graph, srcDoc, offsetX, offsetY)
}

Application.prototype.pasteInGraph = function(targetGraph, srcDoc, offsetX, offsetY) {
	this.undoManager.begin('Paste')

	var createdNodes = []
	var createdConnections = []
	var globalUidMap = {}

	var leftEdgeFound
	var topEdgeFound

	// find top left edge offset in patch
	for (var i=0; i < srcDoc.nodes.length; i++) {
		var n = srcDoc.nodes[i]
		if (!leftEdgeFound || n.x < leftEdgeFound)
			leftEdgeFound = n.x
		if (!topEdgeFound || n.y < topEdgeFound)
			topEdgeFound = n.y
	}

	function placeDocNode(docNode) {
		docNode.x = Math.floor((docNode.x - leftEdgeFound) + offsetX)
		docNode.y = Math.floor((docNode.y - topEdgeFound) + offsetY)
	}

	function mapSlotIds(sids, localUidMap) {
		var nsids = {}
		Object.keys(sids).map(function(oldUid) {
			nsids[localUidMap[oldUid]] = sids[oldUid]
		})
		return nsids
	}

	function remapGraph(g, graphNode) {
		var graph = _.clone(g)
		var localUidMap = {}

		var newUid = E2.core.get_uid()
		globalUidMap[graph.uid] = newUid
		graph.uid = newUid

		graph.nodes.map(function(node) {
			newUid = E2.core.get_uid()
			globalUidMap[node.uid] = newUid
			localUidMap[node.uid] = newUid
			node.uid = newUid

			if (Node.isGraphPlugin(node.plugin))
				node.graph = remapGraph(node.graph, node)
		})

		if (graphNode) {
			var s = graphNode.state

			if (s.input_sids)
				s.input_sids = mapSlotIds(s.input_sids, localUidMap)

			if (s.output_sids)
				s.output_sids = mapSlotIds(s.output_sids, localUidMap)
		}

		graph.conns.map(function(conn) {
			conn.src_nuid = localUidMap[conn.src_nuid]
			conn.dst_nuid = localUidMap[conn.dst_nuid]
			conn.uid = E2.uid()
		})

		return graph
	}

	function remapNodeReferences(graph) {
		graph.nodes.map(function(node) {
			if (Node.isGraphPlugin(node.plugin))
				node.graph = remapNodeReferences(node.graph)

			// eg. gaze clickers refer to the target node with a nodeRef
			if (node.state && node.state.nodeRef) {
				var s = node.state
				var ref = s.nodeRef.split('.')
				var graphUid = ref[0]
				var nodeUid = ref[1]

				graphUid = globalUidMap[graphUid]
				nodeUid = globalUidMap[nodeUid]

				// they have not been remapped (copy & paste in existing graph)
				if (!graphUid || !nodeUid)
					return;

				s.nodeRef = graphUid + '.' + nodeUid
			}
		})

		return graph
	}

	// remap all UID's inside the pasted doc so they are unique in the graph tree.
	var doc = remapGraph(srcDoc)
	doc = remapNodeReferences(doc)

	for(var i = 0, len = doc.nodes.length; i < len; i++) {
		var docNode = doc.nodes[i]
		placeDocNode(docNode)
		this.graphApi.addNode(targetGraph, Node.hydrate(targetGraph.uid, docNode))
		createdNodes.push(targetGraph.findNodeByUid(docNode.uid))
	}

	for(i = 0, len = doc.conns.length; i < len; i++) {
		var dc = doc.conns[i]

		if (!dc.dst_nuid || !dc.src_nuid)
			continue;

		var destNode = targetGraph.findNodeByUid(dc.dst_nuid)
		if (!destNode)
			continue;

		var slot = dc.dst_dyn ?
			destNode.dyn_inputs[dc.dst_slot] :
			destNode.findInputSlotByName(dc.dst_slot) 

		if (!slot) {
			console.warn('Slot not found in', destNode.plugin.id, dc,
				destNode.dyn_inputs)
			continue;
		}
	
		if (dc.src_nuid === undefined || dc.dst_nuid === undefined) {
			// not a valid connection, clear it and skip it
			if (dc.dst_nuid !== undefined) {
				slot.is_connected = false
				slot.connected = false
				destNode.inputs_changed = true
			}

			continue;
		}

		this.graphApi.connect(targetGraph, Connection.hydrate(targetGraph, dc))

		createdConnections.push(targetGraph.findConnectionByUid(dc.uid))
	}

	this.undoManager.end()

	return {
		nodes: createdNodes,
		connections: createdConnections 
	}
}

Application.prototype.getNodeBoundingBox = function(node) {
	var dom = node.ui ? node.ui.dom : null;
	var pos = { left: node.x, top: node.y }

	var width = (dom ? dom.width() : 0)
	var height = (dom ? dom.height() : 0)

	// default width / height = 100 / 20 if the graph is not visible
	if (width === 0)
		width = 100

	if (height === 0)
		height = 20

	return {
		x1: pos.left,
		y1: pos.top,
		x2: pos.left + width,
		y2: pos.top + height
	}
}

// find a space for doc in the graph
// return a {x: ..., y: ...} object with coordinates
// where the object will fit without overlapping with
// any pre-existing nodes
Application.prototype.findSpaceInGraphFor = function(activeGraph, doc) {
	// minimum spacing between nodes
	var spacing = {x: 30, y: 20}

	// create sorted array of nodes in y
	var sortedNodes = activeGraph.nodes.slice()
	sortedNodes.sort(function(a, b) {
		return a.y - b.y
	})

	// find the initial set of bboxes that account for this operation -
	// i.e. anything below the pasted node set
	var bboxes = []

	for(var i = 0; i < sortedNodes.length; ++i) {
		var bbox = this.getNodeBoundingBox(sortedNodes[i])

		if (bbox.y2 + spacing.y < doc.y1) {
			// ignore any nodes above our one, they don't matter
			continue
		}
		else {
			bboxes.push(bbox)
		}
	}

	// easy case, nothing overlaps
	if (bboxes.length === 0) {
		return {x: doc.x1, y: doc.y1}
	}

	// easy case, the next node is outside our bbox vertically
	if (bboxes[0].y1 > doc.y2 + spacing.y) {
		return {x: doc.x1, y: doc.y1}
	}

	// scan the set of bboxes down to find space for our pasted node(s)

	// helper function to find space for pasteBbox within
	// an area filled with graphNodeBboxes
	// returns a {x1, y1, x2, y2} object with an area large
	// enough to contain pasteBbox.
	function autoLayout(pasteBbox, graphNodeBboxes) {
		for(var i = 0; i < graphNodeBboxes.length; ++i) {
			if (graphNodeBboxes[i].y1 > pasteBbox.y2 + spacing.y) {
				// nothing overlaps anymore - return the current location
				return pasteBbox
			}
			else if (pasteBbox.x1 - spacing.x > graphNodeBboxes[i].x2 || pasteBbox.x2 + spacing.x < graphNodeBboxes[i].x1) {
				// ignore any bboxes entirely outside the candidate bbox
			}
			else {
				// move the candidate bbox down by offset = height of a node + spacing
				// and recurse back into trying to match the new candidate area
				var offset = graphNodeBboxes[i].y2 - pasteBbox.y1 + spacing.y

				var newBboxes = graphNodeBboxes.splice(i + 1)
				var newNodeBbox = {x1: pasteBbox.x1, y1: pasteBbox.y1 + offset, x2: pasteBbox.x2, y2: pasteBbox.y2 + offset}

				return autoLayout(newNodeBbox, newBboxes)
			}
		}

		return pasteBbox
	}

	var result = autoLayout(doc, bboxes)
console.debug('autoLayout', doc, bboxes, result)
	return {x: result.x1, y: result.y1}
}

Application.prototype.markNodeAsSelected = function(node, addToSelection) {
	if (node.ui)
		node.ui.setSelected(true)

	if (addToSelection !== false) {
		this.selectedNodes.push(node)
		E2.ui.state.selectedObjects = this.selectedNodes
	}

	if (!this.isWorldEditorActive() && node.isEntityPatch())
		this.worldEditor.selectEntityPatch(node)
}

Application.prototype.deselectNode = function(node) {
	this.selectedNodes.splice(this.selectedNodes.indexOf(node), 1)
	node.ui.setSelected(false);
	E2.ui.state.selectedObjects = this.selectedNodes
}

Application.prototype.markConnectionAsSelected = function(conn) {
	if (conn.ui)
		conn.ui.selected = true
	this.selectedConnections.push(conn)
}

Application.prototype.clearSelection = function() {
	var sn = this.selectedNodes;
	var sc = this.selectedConnections;

	for(var i = 0, len = sn.length; i < len; i++) {
		var nui = sn[i].ui;

		if(nui) {
			nui.setSelected(false);
		}
	}

	for(var i = 0, len = sc.length; i < len; i++) {
		var cui = sc[i].ui;

		if(cui)
			cui.selected = false;
	}

	this.clearNodeSelection()

	this.worldEditor.setSelection([])
}

Application.prototype.clearNodeSelection = function() {
	this.selectedNodes = []
	this.selectedConnections = []
	E2.ui.state.selectedObjects = this.selectedNodes

}

Application.prototype.selectAll = function() {
	this.clearSelection()

	var ag = E2.core.active_graph
	ag.nodes.map(this.markNodeAsSelected.bind(this))
	ag.connections.map(this.markConnectionAsSelected.bind(this))
	this.updateCanvas(true)
}

/**
 * Calculate real area left for canvas
 * @return {Object} Canvas area
 */
Application.prototype.calculateCanvasArea = function() {
	var width, height
	var isFullscreen = E2.util.isFullscreen()

	if (!isFullscreen && !this.condensed_view) {
		width = $(window).width();
		height = $(window).height() -
			$('.editor-header').outerHeight(true) - $('#row2').outerHeight(true) - $('.bottom-panel').outerHeight(true);
	} else {
		width = window.innerWidth
		height = window.innerHeight
	}

	return {
		width: width,
		height: height
	}
}

Application.prototype.onWindowResize = function() {
	if (E2.util.isFullscreen())
		return

	var canvasArea = this.calculateCanvasArea()
	var width = canvasArea.width
	var height = canvasArea.height

	// Set noodles canvas size
	E2.dom.canvas[0].width = width
	E2.dom.canvas[0].height = height
	E2.dom.canvas.css('width', width)
	E2.dom.canvas.css('height', height)

	this.updateCanvas(true)
}

Application.prototype.toggleNoodles = function() {
	this.noodlesVisible = !this.noodlesVisible;
	E2.ui.togglePatchEditor(this.noodlesVisible);
}

Application.prototype.canInitiateCameraMove = function(e) {
	return E2.util.isFullscreen() || this.isVRCameraActive() && E2.util.isCanvasInFocus(e)
}

Application.prototype.setViewCamera = function(isBirdsEyeCamera) {
	this.worldEditor.selectCamera(isBirdsEyeCamera ? 'birdsEye' : 'vr')

	// if helper objects are off, and we're in vr camera, disable world editor entirely
	if (!this.worldEditor.areEditorHelpersActive() && !isBirdsEyeCamera) {
		this.worldEditor.deactivate()
	}
	else if (!this.worldEditor.isActive()) {
		this.worldEditor.activate()
	}
}

// is the VR (experience) camera active AND controllable?
// i.e. graph is not visible
Application.prototype.isVRCameraActive = function() {
	return !this.noodlesVisible && (!E2.app.worldEditor.isActive() || E2.app.worldEditor.cameraSelector.selectedCamera === 'vr')
}

// is the world editor visible AND controllable
// i.e. graph is not visible
Application.prototype.isWorldEditorActive = function() {
	return !this.noodlesVisible && E2.app.worldEditor.isActive()
}
	
Application.prototype.toggleFullscreen = function() {
	var goingToFullscreen = !E2.util.isFullscreen()
	if (goingToFullscreen) {
		this.worldEditor.cameraSelector.selectCamera('vr')
		if (this.worldEditor.isActive()) {
			this.worldEditor.deactivate()
		}
	}

	E2.core.webVRAdapter.enterVROrFullscreen()
}

Application.prototype.toggleHelperObjects = function() {
	// toggle helper objects on & off
	// additionally, if helper objects are off, and we're in vr camera, disable world editor entirely
	var helpersActive = !this.worldEditor.areEditorHelpersActive()
	this.worldEditor.setEditorHelpers(helpersActive)

	if (this.worldEditor.isActive() && !helpersActive && this.worldEditor.cameraSelector.selectedCamera === 'vr') {
		this.worldEditor.deactivate()
	}
	else if (!this.worldEditor.isActive() && helpersActive) {
		// re-enable world editor if needed
		this.worldEditor.activate()
	}
}

Application.prototype.changeControlState = function() {
	var s = this.player.state;
	var cs = this.player.current_state;

	if (cs !== s.PLAYING) {
		E2.dom.playPauseIcon.attr('xlink:href','#icon-play')
		E2.dom.stop.addClass('disabled')
		E2.dom.stop.parent().addClass('active');
		E2.dom.play.parent().removeClass('active');
	} else {
		E2.dom.playPauseIcon.attr('xlink:href','#icon-pause')
		E2.dom.stop.removeClass('disabled')
		E2.dom.stop.parent().removeClass('active');
		E2.dom.play.parent().addClass('active');
	}
}

Application.prototype.onPlayClicked = function() {
	if (this.player.current_state === this.player.state.PLAYING)
		this.player.pause();
	else
		this.player.play();
		
	E2.dom.stop.parent().removeClass('active');
	E2.dom.play.parent().addClass('active');
	
	this.changeControlState();
}

Application.prototype.onPauseClicked = function() {
	this.player.pause()
	this.changeControlState()
}

Application.prototype.onStopClicked = function() {
	this.player.schedule_stop(this.changeControlState.bind(this))
	E2.dom.stop.parent().addClass('active');
	E2.dom.play.parent().removeClass('active');
}

Application.prototype.onOpenClicked = function() {
	var that = this

	FileSelectControl
		.createGraphSelector(null, 'Open', function(path) {
			history.pushState({
				graph: { path: path }
			}, '', path + '/edit')

			that.path = getChannelFromPath(window.location.pathname)
			that.midPane.closeAll()

			that.loadGraph('/data/graph'+path+'.json')
		})
}

Application.prototype.navigateToPublishedGraph = function(graphPath, cb) {
	var graphUrl = '/data/graph' + graphPath + '.json'

	this.path = graphPath

	boot.graph = {
		path: graphPath,
		url: graphUrl
	}

	history.pushState({}, '', graphPath + '/edit')
	
	this.loadGraph(graphUrl).then(cb)
}

Application.prototype.loadGraph = function(graphPath) {
	var that = this
	var dfd = when.defer()

	this.onStopClicked()
	this.player.on_update()

	this.player.load_from_url(graphPath, function() {
		that.setupEditorChannel()
		.then(function() {
			that.startPlaying()
			dfd.resolve()
		})
	})
	
	return dfd.promise
}

Application.prototype.onSaveAsPatchClicked = function() {
	var graph = this.selectionToObject(this.selectedNodes, this.selectedConnections)
	this.openPatchSaveDialog(JSON.stringify({ root: graph }))
}

Application.prototype.openPatchSaveDialog = null;	// ui replaces this


Application.prototype.onPublishClicked = function() {

	if (!E2.models.user.get('username')) {
		return E2.controllers.account.openLoginModal()
			.then(this.onPublishClicked.bind(this))
	}
	
	E2.ui.openPublishGraphModal()
	.then(function(path) {
		window.onbeforeunload = null;	// override "you might be leaving work" prompt (release mode)
		E2.track({ 
			event: 'published',
			path: path
		})
		window.location.href = path
	})
}

Application.prototype.onSaveACopyClicked = function() {
	this.openSaveACopyDialog();
}

Application.prototype.openSaveACopyDialog = function() {
	var that = this
	var dfd = when.defer()

	if (!E2.models.user.get('username')) {
		return E2.controllers.account.openLoginModal()
			.then(this.openSaveACopyDialog.bind(this))
	}

	E2.ui.updateProgressBar(65);

	$.get(URL_GRAPHS, function(files) {
		var fcs = new FileSelectControl()
		.frame('save-frame')
		.template('graph')
		.header('Save as')
		.buttons({
			'Cancel': function() {
				E2.ui.updateProgressBar(100);
			},
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
					success: function(saved) {
						E2.ui.updateProgressBar(100);
						E2.track({
							event: 'savedACopy',
							original: path,
							copy: saved.path
						})
						dfd.resolve(saved.path)
					},
					error: function(x, t, err) {
						E2.ui.updateProgressBar(100);


						if (x.status === 401) {
							return dfd.resolve(
								E2.controllers.account.openLoginModal()
									.then(that.openSaveACopyDialog.bind(that))
							)
						}

						if (x.responseText)
							bootbox.alert('Save failed: ' + x.responseText);
						else
							bootbox.alert('Save failed: ' + err);

						dfd.reject(err)
					}
				})
			}
		})
		.files(files)
		.modal()

		return fcs
	})

	return dfd.promise
}

Application.prototype.growl = function(message, type, duration, user) {
	return VizorUI.growl(message, type, duration, user)
}

Application.prototype.setupStoreListeners = function() {
	function onGraphChanged() {
		if (E2.core.active_graph.plugin)
			E2.core.active_graph.plugin.updated = true

		E2.app.updateCanvas(true)
	}

	function onNodeAdded(graph, node) {
		if (graph === E2.core.active_graph) {
			node.create_ui()

			if (node.ui && node.plugin.state_changed)
				node.plugin.state_changed(node.ui.pluginUI)
		}

		if (node.plugin.isGraph)
			E2.core.rebuild_structure_tree()
	}

	function onNodeRemoved(graph, node) {
		node.destroy_ui()

		if (node.plugin.isGraph)
			E2.core.rebuild_structure_tree()
	}

	function onNodeRenamed(graph, node) {
		// node ui listens to this too
		if (node.plugin.isGraph)
			node.plugin.graph.tree_node.set_title(node.title)

		if (node.plugin.renamed)
			node.plugin.renamed()
	}

	function onConnected(graph, connection) {
		connection.patch_up()

		if (graph === E2.core.active_graph) {
			if (!connection.ui)
				connection.create_ui()
			connection.ui.resolve_slot_divs()
		}

		connection.signal_change(true)
	}

	function onDisconnected(graph, connection) {
		try {
			connection.signal_change(false)
		} catch(e) {
			console.error(e.stack)
		}

		connection.destroy_ui()
	}

	this.graphStore
	.on('snapshotted', function() {
		E2.core.rebuild_structure_tree()
		E2.app.onGraphSelected(E2.core.active_graph)
	})
	.on('changed', onGraphChanged.bind(this))
	.on('nodeAdded', onNodeAdded.bind(this))
	.on('nodeRemoved', onNodeRemoved.bind(this))
	.on('nodeRenamed', onNodeRenamed.bind(this))
	.on('connected', onConnected.bind(this))
	.on('disconnected', onDisconnected.bind(this))
	.on('reordered', function() {
		E2.core.rebuild_structure_tree()
	})
}

Application.prototype.onGraphSelected = function(graph) {
	var that = this

	this.clearNodeSelection()

	E2.core.active_graph.destroy_ui()
	E2.core.active_graph = graph

	E2.dom.canvas_parent.scrollTop(0)
	E2.dom.canvas_parent.scrollLeft(0)
	this.scrollOffset[0] = this.scrollOffset[1] = 0

	E2.dom.breadcrumb.children().remove()

	E2.ui.buildBreadcrumb(E2.core.active_graph)

	E2.core.active_graph.create_ui()

	this.peopleStore.list().map(function(person) {
		if (person.uid === that.channel.uid)
			return

		if (person.activeGraphUid !== E2.core.active_graph.uid)
			that.mouseCursors[person.uid].hide()
		else
			that.mouseCursors[person.uid].show()
	})

	E2.core.active_graph_dirty = true

	E2.app.updateCanvas(true)
}

Application.prototype.setupPeopleEvents = function() {
	var that = this
	var cursors = this.mouseCursors = {}
	var lastMovementTimeouts = this.lastMovementTimeouts = {}

	this.peopleStore.on('removed', function(uid) {
		if (uid === that.channel.uid)
			return;

		var $cursor = cursors[uid]

		// this can happen when reconnected and own uid changes
		// and the previous uid gets a `removed` message.
		if (!$cursor) 
			return;

		$cursor.remove()
		delete cursors[uid]
	})

	this.peopleStore.on('added', function(person) {
		if (person.uid === that.channel.uid)
			return;

		if (cursors[person.uid])
			return;

		var $cursor = $('<div>')
		cursors[person.uid] = $cursor
		lastMovementTimeouts[person.uid] = undefined

		$cursor.addClass('remote-mouse-pointer')
		$cursor.addClass('inactive')
		$cursor.addClass('user-'+person.uid)
		$cursor.css('background-color', person.color)
		$cursor.appendTo('body')

		if (person.activeGraphUid !== E2.core.active_graph.uid)
			$cursor.hide()
	})

	this.peopleStore.on('mouseMoved', function(person) {
		var $cursor = cursors[person.uid]
		var cp = E2.dom.canvases[0];
		$cursor.removeClass('inactive outside')

		// Update the user's cursor fade-out timeout
		clearTimeout(lastMovementTimeouts[person.uid])
		lastMovementTimeouts[person.uid] = setTimeout(function() {
			$cursor.addClass('inactive')
		}, 2000);

		// Received x/y are coordinates atop the canvas.
		var adjustedX = person.x;
		var adjustedY = person.y;
		var cursorIsOutsideViewportX = false;
		var cursorIsOutsideViewportY = false;

		// Calculate viewport top left and bottom right X/Y 
		var viewPortLeftX = E2.app.scrollOffset[0];
		var viewPortTopY = E2.app.scrollOffset[1];

		var viewPortBottomY = E2.app.scrollOffset[1] + E2.app.canvas.height();
		var viewPortRightX = E2.app.scrollOffset[0] + E2.app.canvas.width();

		if(adjustedX < viewPortLeftX) { // On left of the viewport
			adjustedX = cp.offsetLeft;
			cursorIsOutsideViewportX = true;
		}
		else if(adjustedX > viewPortRightX) { // On right side of the viewport
			adjustedX = $(window).width();
			cursorIsOutsideViewportX = true;
		}

		if(adjustedY < viewPortTopY) { // Above viewport
			adjustedY = cp.offsetTop;
			cursorIsOutsideViewportY = true;
		}
		else if(adjustedY > viewPortBottomY) { // Below viewport
			adjustedY = $(window).height();
			cursorIsOutsideViewportY = true;
		}

		if(cursorIsOutsideViewportX) { // If cursor is outside viewport boundaries, blur the cursor
			$cursor.addClass('outside')
		}
		else { // Otherwise, just adjust the received X position for current viewport scrolling so we can get a position relative to the canvas
			adjustedX += cp.offsetLeft - E2.app.scrollOffset[0];
		}

		if(cursorIsOutsideViewportY) { 
			$cursor.addClass('outside')
		}
		else { 
			adjustedY += cp.offsetTop - E2.app.scrollOffset[1];
		}

		$cursor.css('left', adjustedX)
		$cursor.css('top', adjustedY)

	})

	this.peopleStore.on('mouseClicked', function(uid) {
		var $cursor = cursors[uid]
		$cursor.addClass('clicked')

		setTimeout(function() {
			$cursor.removeClass('clicked')
		}, 100)


		clearTimeout(lastMovementTimeouts[uid])
		lastMovementTimeouts[uid] = setTimeout(function() {
			$cursor.addClass('inactive')
		}, 2000);

	})

	this.peopleStore.on('activeGraphChanged', function(person) {
		if (E2.app.channel.uid === person.uid) // it's me
			return E2.app.onGraphSelected(Graph.lookup(person.activeGraphUid))

		var $cursor = cursors[person.uid]
		if (person.activeGraphUid === E2.core.active_graph.uid) 
			$cursor.show()
		else
			$cursor.hide()
	})
}

Application.prototype.onNewClicked = function() {
	window.location.href = '/edit';
}

Application.prototype.onForkClicked = function() {
	this.channel.fork()
}

Application.prototype.setupEditorBindings = function() {
	var that = this

	if (Vizor.releaseMode) {
		window.onbeforeunload = function() {
			return "You might be leaving behind unsaved work. Are you sure you want to close the editor?";
		}
	}

	E2.core.pluginManager.on('created', this.instantiatePlugin.bind(this))

	document.addEventListener('mouseup', this.onMouseReleased.bind(this))
	document.addEventListener('mousemove', this.onMouseMoved.bind(this))

	E2.dom.canvas_parent[0].addEventListener('scroll', function() {
		that.scrollOffset = [ E2.dom.canvas_parent.scrollLeft(), E2.dom.canvas_parent.scrollTop() ]
		var s = E2.dom.canvas[0].style

		s.left = that.scrollOffset[0] + 'px'
		s.top = that.scrollOffset[1] + 'px'

		that.updateCanvas(true)
	})

	E2.dom.canvas_parent[0].addEventListener('mousedown', this.onCanvasMouseDown.bind(this))
	document.addEventListener('mouseup', this.onCanvasMouseUp.bind(this))

	var wasPlayingOnBlur = true
	document.addEventListener('visibilitychange', function() {
		if (!document.hidden && wasPlayingOnBlur) {
			that.player.play()
		} else {
			wasPlayingOnBlur = that.player.state.PLAYING === that.player.current_state
			that.player.pause()
		}

		E2.app.changeControlState()
	})

	window.addEventListener('blur', function() {
		that.clearEditState()
	})

	document.addEventListener('cut', function(e) {
		if (e && E2.util.isTextInputInFocus(e))
			return true

		that.onCut(e)
		e.preventDefault()
	})

	document.addEventListener('copy', function(e) {
		if (e && E2.util.isTextInputInFocus(e))
			return true

		return that.onCopy(e)
	})

	window.addEventListener('paste', function(e) {
		if (e && E2.util.isTextInputInFocus(e))
			return true

		var data = e.clipboardData.getData('text/plain')
		that.onPaste(data)
		e.preventDefault()
	}, false)

	E2.core.on('resize', function() {
		that.onWindowResize()
	})

	// close bootboxes on click
	$(document).on('click', '.bootbox.modal.in', function(e) {
		var $et = $(e.target)
		if (!$et.parents('.modal-dialog').length)
			bootbox.hideAll()
	})

	$('button#fullscreen').click(function() {
		E2.app.toggleFullscreen()
	});

	$('button#help').click(function() {
		window.open('/help/introduction.html', 'Vizor Help');
	});

	$('.resize-handle').on('mousedown', function(e) {
		var $target = $(this).parent()
		var oh = $target.height()
		var oy = e.pageY
		var $doc = $(document)
		var changed = false

		e.preventDefault()
		e.stopPropagation();

		function mouseMoveHandler(e) {
			changed = true
			var nh = oh + (e.pageY - oy)
			e.preventDefault()
			$target.css('height', nh+'px')
			return true
		}

		$doc.on('mousemove', mouseMoveHandler)
		$doc.one('mouseup', function(e) {
			e.preventDefault()
			$doc.off('mousemove', mouseMoveHandler)
			var uiResized = (typeof uiEvent !== 'undefined') ? uiEvent.resized : 'uiResized'
			$target.trigger(uiResized)
		})
	});

	E2.dom.viewSourceButton.click(E2.ui.viewSource);

	E2.dom.saveACopy.click(E2.app.onSaveACopyClicked.bind(E2.app))
	E2.dom.saveAsPatch.click(E2.app.onSaveAsPatchClicked.bind(E2.app))
	E2.dom.open.click(E2.app.onOpenClicked.bind(E2.app))
	E2.dom.btnNew.click(E2.app.onNewClicked.bind(E2.app))
	E2.dom.forkButton.click(E2.app.onForkClicked.bind(E2.app))

	E2.dom.play.click(E2.app.onPlayClicked.bind(E2.app))
	E2.dom.pause.click(E2.app.onPauseClicked.bind(E2.app))
	E2.dom.stop.click(E2.app.onStopClicked.bind(E2.app))

	this.midPane = new E2.MidPane()

	$('[data-toggle="popover"]').popover({
			container: 'body',
			trigger: 'hover',
			animation: false
	});
}

/**
 * Called when Core has been initialized
 * Initializes the Editor Stores and model layer events
 * Then starts the UI layer
 */
Application.prototype.onCoreReady = function(loadGraphUrl) {
	var that = this

	E2.ui.init(E2)

	this.midPane = new E2.MidPane()

	this.patchManager = new PatchManager()
	this.patchManager.on('open', function(patchMeta, json, targetObject3d) {
		if (that.isWorldEditorActive()) {
			that.worldEditor.onPatchDropped(patchMeta, json, targetObject3d)
		} else {
			that.onPaste(json)
		}
	})

	that.setupPeopleEvents()
	that.setupStoreListeners()
	this.setupEditorBindings()

	if (!loadGraphUrl && !boot.hasEdits) {
		loadGraphUrl = '/data/graphs/default.json'
		E2.app.snapshotPending = true
	}

	this.openStartDialog(false, loadGraphUrl)
}

Application.prototype.openStartDialog = function(forceShow, loadGraphUrl) {
	var that = this

	E2.ui.showStartDialog(forceShow)
	.then(function(selectedGraphUrl) {
		if (!selectedGraphUrl)
			selectedGraphUrl = loadGraphUrl

		that.startWithGraph(selectedGraphUrl)
	})
}

Application.prototype.startWithGraph = function(selectedGraphUrl) {
	var that = this

	function start() {
		E2.dom.canvas_parent.toggle(that.noodlesVisible)

		// create root graph ui once to calculate its dimensions
		if (!that.noodlesVisible && E2.core.active_graph !== E2.core.root_graph) {
			if (E2.core.root_graph.ui)
				return;

			E2.core.root_graph.create_ui()
			E2.core.root_graph.destroy_ui()
		}

		that.startPlaying()
	}

	if (!selectedGraphUrl)
		return that.setupEditorChannel().then(start)

	// if we have edits coming in at boot,
	// or we're already on a channel, 
	// and switching to a new template, 
	// create new url and snapshot it
	if (boot.hasEdits || (this.channel && this.channel.isOnChannel)) {
		var path = this.path = E2.uid()
		boot = {}
		history.pushState({}, '', path)
		E2.app.snapshotPending = true
	}

	this.loadGraph(selectedGraphUrl).then(start)
}

Application.prototype.startPlaying = function() {
	E2.core.rebuild_structure_tree()

	this.setActiveGraph(E2.core.active_graph)

	E2.core.emit('vizorFileLoaded')

	this.player.play()

	this.changeControlState()
	this.onWindowResize()

	E2.ui.setPageTitle()

	if (window.location.hash[1] === '/') {
		// path in graph
		// only root supported
		this.setActiveGraph(E2.core.root_graph)
		E2.ui.state.mode = 'program'
	}
}

Application.prototype.setupChat = function() {
	if (this.chat)
		return

	this.chatStore = new E2.ChatStore()
	this.chat = new E2.Chat(E2.dom.chatTab)
	this.chat.start()
}

/**
 * Connect to the EditorChannel for this document
 */
Application.prototype.setupEditorChannel = function() {
	var dfd = when.defer()
	var that = this

	function joinChannel() {
		if (isPublishedGraph(that.path)) {
			that.channel.leave()
			return dfd.resolve()
		}

		var readableName = that.path 
		that.channel.join(that.path, readableName, function() {
			E2.track({ event: 'editorOpened', path: that.path })
			dfd.resolve()
		})
	}

	var wsUrl = this.determineWebSocketEndpoint('/__editorChannel')

	if (!this.channel) {
		this.channel = new E2.EditorChannel()
		this.channel.connect(wsUrl)
		this.channel.on('ready', function() { 
			that.setupChat()
			that.peopleStore.initialize()
			joinChannel()
		})
	} else 
		joinChannel()

	E2.ui.setPageTitle()
	
	return dfd.promise
}

Application.prototype.determineWebSocketEndpoint = function(path) {
	var secure = Vizor.useSecureWebSocket || window.location.protocol === 'https:'
	var wsPort = secure ? 443 : (window.location.port || 80)
	var wsHost = window.location.hostname

	if (Vizor.webSocketHost)
		wsHost = Vizor.webSocketHost

	if (secure)
		wsPort = 443

	var wsUrl = (secure ? 'wss': 'ws') + '://' + 
	wsHost + ':' + wsPort + path

	return wsUrl
}

E2.InitialiseEngi = function(loadGraphUrl) {
	E2.dom.editorHeader = $('.editor-header');

	E2.dom.progressBar = $('#progressbar');
	
	E2.dom.btnNew = $('#btn-new');

	E2.dom.btnAssets = $('#btn-assets');
	E2.dom.btnInspector = $('#btn-inspector');
	E2.dom.btnPatches = $('#btn-patches');
	E2.dom.btnSavePatch = $('#btn-save-patch');
	
	E2.dom.btnGraph = $('#btn-graph');
	E2.dom.btnEditor = $('#btn-editor');
	E2.dom.btnZoomOut = $('#btn-zoom-out');
	E2.dom.btnZoom = $('#btn-zoom');
	E2.dom.btnZoomIn = $('#btn-zoom-in');
	E2.dom.zoomDisplay = $('#current-zoom');
	E2.dom.btnChatDisplay = $('#btn-chat-display');
	
	E2.dom.btnSignIn = $('#btn-sign-in');
	E2.dom.btnAccountMenu = $('#btn-account-top');
	E2.dom.userPullDown = $('#userPullDown');
	
	E2.dom.breadcrumb = $('#breadcrumb');
	
	E2.dom.uiLayer = $('#ui-layer');
	
	E2.dom.assetsLib = $('#assets-lib');
	E2.dom.assetsToggle = $('#assets-toggle');
	E2.dom.assetsClose = $('#assets-close');
	
	E2.dom.patchesLib = $('#patches-lib');
	E2.dom.patches_list = $('#patches');
	E2.dom.objectsList = $('#objects');
	
	E2.dom.canvas_parent = $('#canvas_parent');
	E2.dom.canvas = $('#canvas');
	E2.dom.canvases = $('#canvases');
	E2.dom.controls = $('#controls');
	E2.dom.webgl_canvas = $('#webgl-canvas');
	
	E2.dom.chatWindow = $('#chat-window');
	E2.dom.chatTabs = $('#chat-window>.chat-tabs');
	E2.dom.chatToggleButton = $('#chat-toggle');
	E2.dom.chatClose = $('#chat-close');
	E2.dom.chatTabBtn = $('#chatTabBtn');
	E2.dom.peopleTabBtn = $('#peopleTabBtn');
	E2.dom.chatTab = $('#chatTab');
	E2.dom.chat = $('#chat');
	
	E2.dom.peopleTab = $('#peopleTab');
	E2.dom.patchesToggle = $('#patches-toggle');
	E2.dom.patchesClose = $('#patches-close');
	
	E2.dom.dbg = $('#dbg');

	E2.dom.publishButton = $('#btn-publish');
	E2.dom.play = $('#play');
	E2.dom.play_i = $('i', E2.dom.play);
	E2.dom.pause = $('#pause');
	E2.dom.stop = $('#stop');
	E2.dom.refresh = $('#refresh');
	E2.dom.forkButton = $('#fork-button');
	E2.dom.viewSourceButton = $('#view-source');
	E2.dom.saveACopy = $('.save-copy-button');
	E2.dom.saveAsPatch = E2.dom.btnSavePatch;
	E2.dom.dl_graph = $('#dl-graph');
	E2.dom.open = $('#open');
	E2.dom.structure = $('#structure');
	E2.dom.info = $('#info');
	E2.dom.info._defaultContent = E2.dom.info.html()
	E2.dom.tabs = $('#tabs');
	E2.dom.graphs_list = $('#graphs-list');
	E2.dom.filename_input = $('#filename-input');
	
	E2.dom.dragOverlay = $('#drag-overlay');
	E2.dom.dropArea = $('#drop-area');
	E2.dom.dropUploading = $('#drop-uploading');
	
	E2.dom.bottomBar = $('.bottom-panel');
	
	E2.dom.btnTimeline = $('#btn-timeline');
	
	E2.dom.play = $('#play');
	E2.dom.playPauseIcon = $('#play use');
	E2.dom.pause = $('#pause');
	E2.dom.stop = $('#stop');
	E2.dom.fscreen = $('#fullscreen');
	E2.dom.vrview = $('#vrview');
	
	E2.dom.btnVRCam = $('#btn-vrcam');
	E2.dom.btnEditorCam = $('#btn-editorcam');

	$.ajaxSetup({ cache: false });

	E2.dom.dbg.ajaxError(function(e, jqxhr, settings, ex) {
		if (settings.dataType === 'script') {
			if (typeof(ex) === 'string') {
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

	E2.core = new Core()
	E2.app = new Application()
	E2.ui = new VizorUI();

	var player = new Player()

	E2.treeView = E2.dom.structure.tree = new TreeView(
		E2.dom.structure,
		E2.core.root_graph,
		function() { // On item activation
			E2.app.clearEditState()
			E2.app.clearSelection()

			if (E2.core.active_graph.isEntityPatch() &&  E2.ui.isInProgramMode())
				E2.app.worldEditor.selectEntityPatch(E2.core.active_graph)
		},
		// on graph reorder
		E2.app.graphApi.reorder.bind(E2.app.graphApi)
	)

	E2.app.player = player

	// Shared gl context for three
	var gl_attributes = {
		alpha: false,
		depth: true,
		stencil: true,
		antialias: false,
		premultipliedAlpha: true,
		preserveDrawingBuffer: true
	}

	E2.app.debugFpsDisplayVisible = false 
	E2.app.worldEditor = new WorldEditor(E2.dom.webgl_canvas[0])

	E2.core.glContext = E2.dom.webgl_canvas[0].getContext('webgl', gl_attributes) || E2.dom.webgl_canvas[0].getContext('experimental-webgl', gl_attributes)
	E2.core.renderer = new THREE.WebGLRenderer({context: E2.core.glContext, canvas: E2.dom.webgl_canvas[0]})

	E2.core.on('ready', E2.app.onCoreReady.bind(E2.app, loadGraphUrl))
}

if (typeof(module) !== 'undefined')
	module.exports = Application

})()

