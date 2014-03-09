E2.p = E2.plugins["text_editor_generator"] = function(core, node)
{
	this.desc = 'Edit a block of text.';
	
	this.input_slots = [];
	this.output_slots = [
		{ name: 'text', dt: core.datatypes.TEXT, desc: 'The currently entered text.', def: 'Empty string' }
	];
	
	this.state = { text: '{\n\n}' };
	
	this.core = core;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.open_editor = function(self) { return function(e)
{
	var diag = make('span');
	var src = $('<pre id="editor"></pre>'); 
	
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
	
  	diag.append(src);
	
	var editor = ace.edit(src[0]);
	
	editor.setTheme('ace/theme/chrome');
	editor.getSession().setUseWrapMode(false);
	editor.setBehavioursEnabled(false);
	editor.setShowPrintMargin(false);
	editor.getSession().setMode('ace/mode/json');
	editor.setValue(self.state.text);
	editor.gotoLine(2);
	editor.session.selection.clearSelection();

	var store_state = function(editor, diag) { return function(e)
	{
		if(e && e.target.className === 'ace_text-input')
			return false;
		
		self.state.text = editor.getValue();
		self.updated = true;
		diag.dialog('close');
	}};
	
	self.core.create_dialog(diag, 'Editor', 760, 150, store_state(editor, diag));
}};

E2.p.prototype.create_ui = function()
{
	var inp = $('<input id="btn" type="button" value="Open" title="Click to edit the contents." />');
	
	inp.css('width', '55px');
	inp.click(this.open_editor(this));
	
	return inp;
};

E2.p.prototype.update_output = function(slot)
{
	return this.state.text;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.core.add_aux_script('ace/ace.js');
};
