(function(){

var Text = E2.plugins.const_text_generator = function(core, node) {
	Plugin.apply(this, arguments)
	this.desc = 'Enter a constant text string.'
	
	this.input_slots = []
	this.output_slots = [
		{ name: 'text', dt: core.datatypes.TEXT, desc: 'The currently entered text.', def: 'Empty string' }
	]
	
	this.state = { text: '', width: 0, height: 0 }
}

Text.prototype = Object.create(Plugin.prototype)

Text.prototype.reset = function() {
	this.updated = true
}

Text.prototype.create_ui = function() {
	var that = this
	var inp = $('<textarea placeholder="Type text here" />')
	
	inp.css({
		'font-size': '8pt',
		'border': '1px solid #999',
		'margin': '0px',
		'margin-top': '2px',
		'padding': '2px'
	})
	
	inp.on('change', function() {
		that.undoableSetState('text', inp.val(), that.state.text)
	})
	
	// Chrome doesn't handle resize properly for anything but the window object,
	// so we store the potentially altered size of the textarea on mouseup.
	inp.mouseup(function() {
		var ta = $(this)
		
		that.state.width = ta.width()
		that.state.height = ta.height()
	})
	
	this.node.on('pluginStateChanged', this.updateUi.bind(this))
	
	this.ui = inp

	return this.ui
}

Text.prototype.update_output = function() {
	return this.state.text
}

Text.prototype.state_changed = function() {
	this.updateUi()
}

Text.prototype.updateUi = function() {
	if (!this.ui)
		return

	var s = this.state
	
	if (!s.text)
		return 

	this.ui.val(s.text)
	
	if (s.width > 0)
		this.ui.css('width', s.width)
	
	if (s.height > 0)
		this.ui.css('height', s.height)
}

})()
