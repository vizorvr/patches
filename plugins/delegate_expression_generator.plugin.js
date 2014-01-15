E2.p = E2.plugins["delegate_expression_generator"] = function(core, node)
{
	this.desc = 'Emit a float delegate that resolves an integer parameter \'<b>x</b>\' to the value of an arbitrary javascript expression that can be contingent on an arbitrary number of dynamic input float slots.';
	
	this.input_slots = [];
	
	this.output_slots = [ 
		{ name: 'delegate', dt: core.datatypes.DELEGATE, desc: 'The resulting float delegate.' } 
	];
	
	this.state = {
		expression: '',
		slot_ids: {} 
	};

	this.core = core;
	this.node = node;
	this.gl = core.renderer.context;
	this.slot_name = [];
	this.slot_data = {};
};

E2.p.prototype.delegate_func = function(self) { return function(x)
{
	if(self.state.expression === '')
		return 0;
	
	with(Math)
	{
		with(self.slot_data)
		{
			try
			{
				var r = eval(self.state.expression);
				
				return typeof(r) === 'number' ? r : 0;
			}
			catch(e)
			{
				msg('ERROR: Failed to evaluate expression: ' + e);
				return 0;
			}
		}
	}
}};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.open_editor = function(self, done_func, dest) { return function(e)
{
	var diag = make('span');
	var src = $('<pre id="editor"></pre>'); 
	var btn_span = make('span');
	var add_btn = $('<input id="add_btn" type="button" value="+" title="Click to add new delegate input slot." />');
	var rem_btn = $('<input id="rem_btn" type="button" value="-" title="Click to remove the selected slot(s)." />');
	var slot_list = $('<select size="4" />');
	var exp_lbl = $('<div>Expression</div>');
	var slot_lbl = $('<div>Inputs</div>');
		
	diag.css({
		'margin': '0px',
		'padding': '2px'
	});

	src.css({
		'margin': '0px',
		'padding': '0px',
		'margin-top': '2px',
		'border': '1px solid #bbb',
		'width': '755px',
		'height': '400px',
		'resize': 'none',
		'font-size': '12px',
		'font-family': 'Monospace',
		'scroll': 'none'
	});
	
	var lbl_css = {
		'font-size': '16px',
		'float': 'left',
		'padding': '8px 0px 2px 2px'
	};
	
	var slt_btn_css = {
		'float': 'right',
		'margin': '2px',
		'padding': '2px',
		'width': '30px'
	};

	slot_list.css({
		'border': '1px solid #bbb',
		'width': '757px',
		'margin-left': '2px',
		'background-color': '#ddd'
	});

	exp_lbl.css(lbl_css);
	slot_lbl.css(lbl_css);
	rem_btn.css(slt_btn_css);
	add_btn.css(slt_btn_css);
		
	diag.append(exp_lbl);
  	diag.append(src);
	
	btn_span.css('width', '755px');
	btn_span.append(slot_lbl);
	btn_span.append(add_btn);
	btn_span.append(rem_btn);
	
	diag.append(make('br'));
	diag.append(btn_span);
	diag.append(make('br'));
	diag.append(slot_list);

	var editor = ace.edit(src[0]);
	
	editor.setTheme('ace/theme/chrome');
	editor.getSession().setUseWrapMode(false);
	editor.setBehavioursEnabled(false);
	editor.setShowPrintMargin(false);
	editor.getSession().setMode('ace/mode/javascript');
	editor.setValue(self.state.expression);
	editor.gotoLine(0);
	editor.session.selection.clearSelection();

	// Rebuild slot list.
	for(var ident in self.state.slot_ids)
	{
		var sid = self.state.slot_ids[ident];

		slot_list.append($('<option>', { value: sid }).text(ident));
	}			
	
	add_btn.click(function(self) { return function(e)
	{
		var diag2 = make('div');
		var inp = $('<input type="input" />'); 

		var l1 = make('span');
		var lbl = $('<div>Identifier:</div>');
		
		inp.css('width', '220px');
		
		lbl.css({
			'padding-top': '3px',
			'float': 'left',
			'width': '80px'
		});
		
		l1.append(lbl);
		l1.append(inp);
		
		diag2.append(l1);
		
		var finish_func = function(self) { return function(e)
		{
			var sname = inp.val();
			var cid = sname.replace(' ', '_').toLowerCase();
			var sid = self.node.add_slot(E2.slot_type.input, { name: cid, dt: self.core.datatypes.FLOAT });

			self.state.slot_ids[cid] = sid;
			self.slot_name[sid] = cid;
			self.slot_data[cid] = null;
			slot_list.append($('<option>', { value: sid }).text(cid));
			
			diag2.dialog('close');
		}}(self);
		
		self.core.create_dialog(diag2, 'Create new slot.', finish_func);
	}}(self));
	
	rem_btn.click(function(self) { return function(e)
	{
		var sel = slot_list.val();
		
		if(sel === null)
			return;
			
		var cid = slot_list.find("option[value='" + sel + "']").remove().text();
		
		sel = parseInt(sel);
		
		delete self.state.slot_ids[cid];
		self.node.remove_slot(E2.slot_type.input, sel);
	}}(self));
	
	var store_state = function(editor, dest, done_func, diag) { return function(e)
	{
		if(e && e.target.className === 'ace_text-input')
			return;
		
		dest(editor.getValue());
		done_func(diag);
	}};
	
	self.core.create_dialog(diag, 'Edit expression.', 760, 150, store_state(editor, dest, done_func, diag));
}};

E2.p.prototype.create_ui = function()
{
	var layout = make('div');
	var inp = $('<input id="slot_btn" type="button" value="Edit" title="Click to edit the expression input slots." />');
	
	inp.css('width', '55px');
	
	var done_func = function(self) { return function(diag)
	{
		self.updated = true;
		
		if(diag)
			diag.dialog('close');
	}}(this);
	
	inp.click(this.open_editor(this, done_func, function(self) { return function(ex)
	{
		self.state.expression = ex;
		self.updated = true;
	}}(this)));
	
	layout.append(inp);
	
	return layout;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.slot_data[this.slot_name[slot.uid]] = data;
};

E2.p.prototype.update_state = function()
{
};

E2.p.prototype.update_output = function(slot)
{
	return this.delegate;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.delegate = new Delegate(this.delegate_func(this), this.core.datatypes.FLOAT, Number.POSITIVE_INFINITY);
		
		var sids = this.state.slot_ids;
		
		for(var cid in sids)
		{
			if(!sids.hasOwnProperty(cid))
				continue;
			
			var sid = sids[cid];
			
			this.slot_name[sid] = cid;
			this.slot_data[cid] = null;
		}
	}
	else
	{
		this.core.add_aux_script('ace/ace.js');
	}
};
