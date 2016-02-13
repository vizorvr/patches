(function(){
var minWidth = 120
var minHeight = 80
var maxWidth = 550
var maxHeight = 440
var clamp = THREE.Math.clamp
var Text = E2.plugins.const_text_generator = function(core, node) {
	Plugin.apply(this, arguments)
	this.desc = 'Enter a constant text string.'

	this.inp = {}

	this.input_slots = []
	this.output_slots = [
		{ name: 'text', dt: core.datatypes.TEXT, desc: 'The currently entered text.', def: 'Empty string' }
	]
	
	this.state = { text: '', width: minWidth, height: minHeight }
}

Text.prototype = Object.create(Plugin.prototype)

Text.prototype.reset = function() {
	this.updated = true
}

Text.prototype.create_ui = function() {
	var that = this

	var adapter = {
		get text()  	{ return that.state.text; },
		set text(str) 	{ return that.state.text = str},
		get width()  	{ return that.state.width },
		set width(px) 	{ return that.state.width = clamp(px, minWidth, maxWidth) },
		get height()  	{ return that.state.height },
		set height(px) 	{ return that.state.height = clamp(px, minHeight, maxHeight) }
	}

	var onChange 		= this.updateUi.bind(this)
	var onBeginChange 	= this.beginBatchModifyState.bind(this)
	var onEndChange 	= function() { that.endBatchModifyState('Text') }
	this.ui = new UITextArea(adapter, onBeginChange, onChange, onEndChange)

	var inp = this.ui.dom.find('textarea')
	var t = null
	inp.on('keyup', function(){
		if (t) clearTimeout(t)
		t = setTimeout(function(){that.transientSetState('text', inp.val())}, 300)
	})
	this.node.on('pluginStateChanged', this.updateUi.bind(this))

	return this.ui.dom
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

	this.ui.update()
}

})()
