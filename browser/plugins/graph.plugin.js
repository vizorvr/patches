(function() {
var GraphPlugin = E2.plugins.graph = function(core) {
	SubGraphPlugin.apply(this, arguments)

	this.desc = 'Encapsulate a nested graph into- and out of which arbitrary data can be routed and the encapsulated logic. Add input / output proxies inside the graph to feed data in / out of the graph.'
	
	this.input_slots = []
	
	this.output_slots = []
	
	this.state = {
		always_update:  true,
		input_sids:     {},
		output_sids:    {}
	}
		
	this.is_reset = true
}

GraphPlugin.prototype = Object.create(SubGraphPlugin.prototype)

GraphPlugin.prototype.open_editor = function(self) {
	var diag = make('div')
	var always_upd = $('<input id="always_upd" type="checkbox" title="If false, this graph is updated only when one of its inputs updates." />')
	var upd_lbl = $('<div>Always update:</div>')
	var r1 = make('div')
	
	var lbl_css = {
		'font-size': '14px',
		'float': 'left',
		'padding': '8px 0px 2px 2px',
	}
	
	var inp_css = {
		'float': 'right',
		'margin': '2px',
		'padding': '2px',
		'width': '70px'
	}

	diag.css({
		'margin': '0px',
		'padding': '2px',
	})

	r1.css('clear', 'both')
	r1.addClass('clearfix')

	always_upd.css(inp_css)
	upd_lbl.css(lbl_css)
	always_upd.css({ 'width': '13px', 'margin-top': '8px' })
	
	always_upd.attr('checked', self.state.always_update)

	r1.append(upd_lbl)
	r1.append(always_upd)
	diag.append(r1)

	
	var store_state = function(self, always_upd) { return function()
	{
		self.state.always_update = always_upd.is(":checked")
	}}
	
	self.core.create_dialog(diag, 'Edit Preferences', 460, 250, store_state(self, always_upd))
}

GraphPlugin.prototype.create_ui = function() {
	var ui = make('div')
	var inp_edit = makeButton('Edit', 'Open this graph for editing.')
	
	inp_edit.click(function(self) { return function() 
	{
		if(self.graph)
		{
			var ptn = self.graph.parent_graph.tree_node
			
			if(!ptn.open)
			{
				ptn.graph.open = true
				ptn.rebuild_dom()
			}
			
			self.graph.tree_node.activate()
		}
	}}(this))
	
	ui.css('text-align', 'center')
	ui.append(inp_edit)
	
	this.ui = ui
	
	return ui
}

GraphPlugin.prototype.update_input = function(slot, data) {
	if (slot.uid === undefined) {
		console.log('graph.plugin undefined uid')
	} else {
		this.input_nodes[slot.uid].plugin.input_updated(data)
	}
}

GraphPlugin.prototype.update_state = function() {
	this.updated = false
	this.updated_sids.length = 0

	if(this.graph) {
		if(this.graph.update() && this.graph === E2.app.player.core.active_graph)
			E2.app.updateCanvas(false)
	}
}

GraphPlugin.prototype.state_changed = function(ui) {
	var core = this.core
	var node = this.parent_node
	var self = this
	
	// Only rebuild the node lists during post-load patch up of the graph, 
	// during which 'ui' will be null. Otherwise the lists would have been rebuilt 
	// every time we switch to the graph containing this node in the editor.
	if (ui) {
		// Decorate the auto generated dom base element with an
		// additional class to allow custom styling.
		node.ui.dom.addClass('graph')

		var inp_config = makeButton(null, 'Edit preferences', 'config_btn')

		inp_config.click(function() {
			self.open_editor(self)
		})
		
		$(node.ui.dom[0].children[0].children[0].children[0]).append(inp_config)
		return
	}
	
	this.setupProxies()
}


})()