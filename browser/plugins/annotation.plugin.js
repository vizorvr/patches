(function(){
Annotation = E2.plugins.annotation = function() {
	Plugin.apply(this, arguments)
	this.desc = 'Add textual hints to the graph.';
	
	this.input_slots = [];
	
	this.output_slots = [];
	
	this.state = { text: '', width: 0, height: 0 };
};
Annotation.prototype = Object.create(Plugin.prototype)

Annotation.prototype.create_ui = function() {
	var that = this
	var inp = $('<textarea placeholder="Type text here" />');
	
	inp.css({
		'font-size': '8pt',
		'border': '1px solid #999',
		'margin': '0px',
		'margin-top': '2px',
		'padding': '2px',
		'resize': true
	});
	
	inp.on('change', function() {
		that.undoableSetState('text', inp.val(), that.state.text)
	})
	
	// Chrome doesn't handle resize properly for anything but the window object,
	// so we store the potentially altered size of the textarea on mouseup.
	inp.mouseup(function() {
		var ta = $(this);

		that.state.width = ta.width();
		that.state.height = ta.height();
	})
	
	return inp;
}

Annotation.prototype.state_changed = function(ui) {
	var s = this.state;
	
	if(ui && s.text !== '')
	{
		ui.val(s.text);
		
		if(s.width > 0)
			ui.css('width', s.width);
		
		if(s.height > 0)
			ui.css('height', s.height);
	}
};
})()