E2.p = E2.plugins["delegate_expression_generator"] = function(core, node)
{
	this.desc = 'Emit a value delegate that resolves an integer parameter \'<b>x</b>\' to the value of an arbitrary javascript expression that can be contingent on an arbitrary number of dynamic input float slots.';
	
	this.input_slots = [];
	
	this.output_slots = [ 
		{ name: 'delegate', dt: core.datatypes.DELEGATE, desc: 'The resulting delegate.' } 
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
	with(x)
	{
		with(Math)
		{
			with(self.slot_data)
			{
				return eval((self.state.expression));
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
	var src = $('<textarea></textarea>'); 
	
	diag.css('margin', '0px');
	diag.css('padding', '2px');

	src.css('margin', '0px');
	src.css('padding', '0px');
	src.css('margin-top', '2px');
	src.css('border', 'none');
	src.css('width', '455px');
	src.css('height', '400px');
	src.css('resize', 'none');
	src.css('font-size', '9pt');
	src.css('font-family', 'Monospace');
	src.css('overflow', 'scroll');
	src.css('word-wrap', 'normal');
	src.css('white-space', 'pre');
	src.css('background-color', '#ddd');
	
	src.val(self.state.expression);
	
	diag.append(src);
	
	var btn_span = make('span');
	var add_btn = $('<input id="add_btn" type="button" value="Add slot" title="Click to add new delegate input slot." />');
	var rem_btn = $('<input id="rem_btn" type="button" value="Remove slot" title="Click to remove the selected slot(s)." />');
	var slot_list = $('<select size="4" />');
	
	slot_list.css('border', 'none');
	slot_list.css('width', '457px');
	slot_list.css('margin-left', '2px');
	slot_list.css('background-color', '#ddd');

	btn_span.css('width', '455px');
	btn_span.append(add_btn);
	btn_span.append(rem_btn);
	
	diag.append(make('br'));
	diag.append(btn_span);
	diag.append(make('br'));
	diag.append(slot_list);

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
		lbl.css('padding-top', '3px');
		lbl.css('float', 'left');
		lbl.css('width', '80px');
		
		l1.append(lbl);
		l1.append(inp);
		
		diag2.append(l1);
		
		var finish_func = function(self) { return function()
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
		
		diag2.dialog({
			width: 360,
			height: 170,
			modal: true,
			title: 'Create new slot.',
			show: 'slide',
			hide: 'slide',
			buttons: {
				'OK': function()
				{
					finish_func();
				},
				'Cancel': function()
				{
					$(this).dialog('close');
				}
			},
			open: function()
			{
				diag2.keyup(function(e)
				{
					if(e.keyCode === $.ui.keyCode.ENTER)
						finish_func();
				});
			}
		});
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
	
	diag.dialog({
		width: 460,
		height: 150,
		modal: true,
		title: 'Edit expression.',
		show: 'slide',
		hide: 'slide',
		buttons: {
			'OK': function()
			{
				dest(src.val());
				done_func(diag);
			},
			'Cancel': function()
			{
				$(this).dialog('close');
			}
		}
	});
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

E2.p.prototype.update_state = function(delta_t)
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
		this.delegate = new Delegate(this.delegate_func(this), Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
		
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
};
