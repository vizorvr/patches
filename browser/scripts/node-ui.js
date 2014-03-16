function NodeUI(parent_node, x, y) {
	this.parent_node = parent_node;
	this.x = x;
	this.y = y;
	this.sl = E2.app.scrollOffset[0];
	this.st = E2.app.scrollOffset[1];
	this.plugin_ui = null;
	
	var nid = 'n' + parent_node.uid, dom = this.dom = make('table');
	
	dom.addClass('plugin');
	dom.addClass('ui-widget-content');
	dom.css('border', '1px solid #444');
	dom.attr('id', nid);
	dom.mousemove(E2.app.onMouseMoved); // Make sure we don't stall during slot connection, when the mouse enters a node.
	
	dom.addClass('pl_layout');
	
	var h_row = make('tr');
	var h_cell = make('td');
	var icon = make('span');
	var lbl = make('span');
	
	icon.addClass('plugin-icon');
	icon.addClass('icon-' + parent_node.plugin.id);
	icon.click(function(self) { return function()
	{
		self.parent_node.open = !self.parent_node.open;
		self.content_row.css('display', self.parent_node.open ? 'table-row' : 'none');
		self.parent_node.update_connections();
		E2.app.updateCanvas(true);
	}}(this));
	
	lbl.text(parent_node.get_disp_name());
	lbl.addClass('t');

	h_cell.attr('colspan', '3');
	h_cell.addClass('pl_title');
	h_cell.append(icon);
	h_cell.append(lbl);
	h_row.append(h_cell);
	h_row.addClass('pl_header');
	h_row.click(E2.app.onNodeHeaderClicked);
	h_row.dblclick(E2.app.onNodeHeaderDblClicked(parent_node));
	h_row.mouseenter(E2.app.onNodeHeaderEntered(parent_node));
	h_row.mouseleave(E2.app.onNodeHeaderExited);

	if(parent_node.plugin.desc)
	{
		var p_name = E2.app.player.core.plugin_mgr.keybyid[parent_node.plugin.id];
		
		h_row.attr('alt', '<b>' + p_name + '</b><br/><hr/>' + parent_node.plugin.desc);
		h_row.hover(E2.app.onShowTooltip, E2.app.onHideTooltip);
	}

	dom.append(h_row);
	
	this.header_row = h_row;
	
	var row = this.content_row = make('tr');
	
	row.css('display', parent_node.open ? 'table-row' : 'none');
	dom.append(row)
	
	var input_col = make('td');
	var content_col = make('td');
	var output_col = make('td');
	
	input_col.addClass('ic');
	content_col.addClass('pui_col');
	content_col.addClass('cc');
	output_col.addClass('oc');
	
	if((parent_node.dyn_inputs ? parent_node.dyn_inputs.length : 0) + parent_node.plugin.input_slots.length)
		input_col.css('padding-right', '6px');
	
	row.append(input_col)
	row.append(content_col)
	row.append(output_col)
	
	NodeUI.render_slots(parent_node, nid, input_col, parent_node.plugin.input_slots, E2.slot_type.input);
	NodeUI.render_slots(parent_node, nid, output_col, parent_node.plugin.output_slots, E2.slot_type.output);
	
	if(parent_node.dyn_inputs)
		NodeUI.render_slots(parent_node, nid, input_col, parent_node.dyn_inputs, E2.slot_type.input);
	
	if(parent_node.dyn_outputs)
		NodeUI.render_slots(parent_node, nid, output_col, parent_node.dyn_outputs, E2.slot_type.output);

	var plugin = parent_node.plugin;
	
	if(plugin.create_ui)
	{
		this.plugin_ui = plugin.create_ui();
		
		content_col.append(this.plugin_ui);
	}
	else
		this.plugin_ui = {}; // We must set a dummy object so plugins can tell why they're being called.
	
	make_draggable(dom, E2.app.onNodeDragged(parent_node), E2.app.onNodeDragStopped(parent_node));
    	
	var s = dom[0].style;
	
	s.left = '' + x + 'px';
	s.top = '' + y + 'px';
	E2.dom.canvas_parent.append(dom);
}

NodeUI.create_slot = function(parent_node, nid, col, s, type)
{
	var div = make('div');

	if(s.uid !== undefined)
		div.attr('id', nid + (type === E2.slot_type.input ? 'di' : 'do') + s.uid);
	else
		div.attr('id', nid + (type === E2.slot_type.input ? 'si' : 'so') + s.index);

	div.text(s.name);
	div.addClass('pl_slot');
	div.definition = s;

	div.mouseenter(E2.app.onSlotEntered(parent_node, s, div));
	div.mouseleave(E2.app.onSlotExited(parent_node, s, div));
	div.mousedown(E2.app.onSlotClicked(parent_node, s, div, type));

	dsc = 'Type: ' + s.dt.name;
	
	if(s.lo !== undefined || s.hi !== undefined)
		dsc += '\nRange: ' + (s.lo !== undefined ? 'min. ' + s.lo : '') + (s.hi !== undefined ? (s.lo !== undefined ? ', ' : '') + 'max. ' + s.hi : '')
	
	if(s.def !== undefined)
		dsc += '\nDefault: ' + s.def

	dsc += '<break>';
	
	if(s.desc)
		dsc += s.desc;

	div.attr('alt', dsc);
	div.hover(E2.app.onShowTooltip, E2.app.onHideTooltip);
	col.append(div);
};

NodeUI.render_slots = function(parent_node, nid, col, slots, type)
{
	for(var i = 0, len = slots.length; i < len; i++)
		NodeUI.create_slot(parent_node, nid, col, slots[i], type);
};

