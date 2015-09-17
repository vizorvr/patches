(function() {
var LoopPlugin = E2.plugins.loop = function(core) {
	SubGraphPlugin.apply(this, arguments)

	this.desc = 'Encapsulate a nested graph into- and out of which arbitrary data can be routed and run the enclosed logic once per loop iteration. The loop counter is made available to enclosing logic as a local variable with the name <b>index<\/b>.';

	this.input_slots = [
		{ name: 'first', dt: core.datatypes.FLOAT, desc: 'The start index.', def: 0 },
		{ name: 'last', dt: core.datatypes.FLOAT, desc: 'The end index.', def: 0 },
		{ name: 'step', dt: core.datatypes.FLOAT, desc: 'Loop index increment.', def: 1 }
	]

	this.output_slots = [
	]

	this.state = { input_sids: {}, output_sids: {}, always_update: true };
}

LoopPlugin.prototype = Object.create(SubGraphPlugin.prototype)

LoopPlugin.prototype.open_editor = function(self)
{
	var diag = make('div');
	var always_upd = $('<input id="always_upd" type="checkbox" title="If false, this graph is updated only when one of its inputs updates." />');
	var upd_lbl = $('<div>Always update:</div>');
	var r1 = make('div');

	var lbl_css = {
		'font-size': '14px',
		'float': 'left',
		'padding': '8px 0px 2px 2px',
	};

	var inp_css = {
		'float': 'right',
		'margin': '2px',
		'padding': '2px',
		'width': '13px',
		'margin-top': '8px'
	};

	diag.css({
		'margin': '0px',
		'padding': '2px',
	});

	r1.css('clear', 'both');
	always_upd.css(inp_css);
	upd_lbl.css(lbl_css);

	always_upd.attr('checked', self.state.always_update);

	r1.append(upd_lbl);
	r1.append(always_upd);
	diag.append(r1);

	var store_state = function(self, always_upd) { return function(e)
	{
		self.state.always_update = always_upd.is(":checked");
	}};

	self.core.create_dialog(diag, 'Edit Preferences.', 460, 250, store_state(self, always_upd));
};

LoopPlugin.prototype.create_ui = function()
{
	var ui = make('div');
	var inp_edit = makeButton('Edit', 'Open this loop for editing.');

	inp_edit.click(function(self) { return function(e)
	{
		if(self.graph)
			self.graph.tree_node.activate();
	}}(this));

	ui.css('text-align', 'center');
	ui.append(inp_edit);

	return ui;
};

LoopPlugin.prototype.update_input = function(slot, data)
{
	if(slot.uid === undefined)
	{
		if(slot.index === 0)
			this.first = Math.floor(data);
		else if(slot.index === 1)
			this.last = Math.floor(data);
		else
		{
			this.step = Math.abs(data);
			this.step = this.step < 1.0 ? 1 : Math.floor(this.step);
		}
	}
	else
	{
		this.input_nodes[slot.uid].plugin.input_updated(data)
	}
};

LoopPlugin.prototype.update_state = function()
{
	this.updated = false;
	this.updated_sids.length = 0;

	if(this.first > this.last)
	{
		var t = this.first;

		this.first = this.last;
		this.last = t;
	}

	if(this.graph && this.step > 0)
	{
		var updated = false;

		for(var cnt = this.first; cnt < this.last; cnt += this.step)
		{
			this.graph.variables.write('index', cnt);
			this.graph.reset();

			if(this.graph.update())
				updated = true;
		}

		if(updated && this === E2.app.player.core.active_graph)
			E2.app.updateCanvas(false);
	}
};

LoopPlugin.prototype.variable_dt_changed = function() {}

LoopPlugin.prototype.state_changed = function(ui)
{
	var core = this.core;
	var node = this.parent_node;
	var self = this;

	// Only rebuild the node lists during post-load patch up of the graph,
	// during which 'ui' will be null. Otherwise the lists would have been rebuilt
	// every time we switch to the graph containing this node in the editor.
	if(ui)
	{
		// Decorate the auto generated dom base element with an
		// additional class to allow custom styling.
		node.ui.dom.addClass('graph loop');

		var inp_config = makeButton(null, 'Edit preferences.', 'config_btn');

		inp_config.click(function(self) { return function(e)
		{
			self.open_editor(self);
		}}(this));

		$(node.ui.dom[0].children[0].children[0].children[0]).append(inp_config);
		return;
	}

	this.setupProxies()

	this.first = 0;
	this.last = 0;
	this.step = 1;

	this.graph.variables.lock(this, 'index');
	var rdt = this.graph.variables.variables['index'].dt;

	if (rdt.id === this.core.datatypes.ANY.id)
		this.graph.variables.set_datatype('index', core.datatypes.FLOAT);
};

})()
