var AbstractTextareaPlugin = function AbstractTextareaPlugin(core, node) {
	Plugin.apply(this, arguments)
	this.desc = 'Enter a constant text string.'

	this._uiDetachQueue = []

	this.undoName = 'Textarea'
	this.uiMinWidth = 120
	this.uiMinHeight = 80
	this.uiMaxWidth = 550
	this.uiMaxHeight = 440

	this.inp = {}

	this.input_slots = []
	this.output_slots = [
		{ name: 'text', dt: core.datatypes.TEXT, desc: 'The currently entered text.', def: 'Empty string' }
	]

	this.state = { text: '', width: this.uiMinWidth, height: this.uiMinHeight }
}

AbstractTextareaPlugin.prototype = Object.create(Plugin.prototype)
AbstractTextareaPlugin.prototype.constructor = AbstractTextareaPlugin

AbstractTextareaPlugin.prototype.reset = function() {
	this.updated = true
}

AbstractTextareaPlugin.prototype.create_ui = function() {
	var that = this
	var clamp = THREE.Math.clamp

	var adapter = {
		get text()  	{ return that.state.text },
		set text(str) 	{ return that.state.text = str},
		get width()  	{ return that.state.width },
		set width(px) 	{ return that.state.width = clamp(px, that.uiMinWidth, that.uiMaxWidth) },
		get height()  	{ return that.state.height },
		set height(px) 	{ return that.state.height = clamp(px, that.uiMinHeight, that.uiMaxHeight) }
	}

	var onChange 		= this.updateUi.bind(this)
	var onBeginChange 	= this.beginBatchModifyState.bind(this)
	var onEndChange 	= function() { that.endBatchModifyState(that.undoName) }
	this.ui = new UITextArea(adapter, onBeginChange, onChange, onEndChange)

	var inp = this.ui.dom.find('textarea')
	var t = null
	inp.on('keyup', function(){
		if (t) clearTimeout(t)
		t = setTimeout(function(){that.transientSetState('text', inp.val())}, 300)
	})
	this.node.on('pluginStateChanged', this.updateUi.bind(this))

	var adjustWidth = function(minWidth) {
		that.uiMinWidth = minWidth - 45
		if (that.uiMinWidth > that.state.width) {
			that.state.width = that.uiMinWidth
			that.ui.update()
		}
	}

	// setup an invisible node UI for a Node of the same plugin kind
	// rename it, get the available content area, and size ourselves accordingly
	var onRenamed = function(name){
		var nu = new NodeUI(new Node(null, that.id, -1000,-1000))
		nu.onRenamed(name)
		adjustWidth(nu.content.width())
		nu.destroy()
	}

	that.node.on('renamed', onRenamed)
	this._uiDetachQueue.push(function(){
		that.node.removeListener('renamed', onRenamed)
	})

	// listen to when the node UI has been created, in case our width needs adjusting
	this.node.once('uiCreated', function($contentContainer){
		adjustWidth($contentContainer.width())
	})

	return this.ui.dom
}

AbstractTextareaPlugin.prototype.destroy_ui = function() {
	var q = this._uiDetachQueue
	if (q && q.length) {
		var removeHandler
		while (removeHandler = q.pop()) {
			removeHandler()
		}
	}
	if (this.ui)
		this.ui.destroy()

	this.ui = null
}

AbstractTextareaPlugin.prototype.update_output = function() {
	return this.state.text
}

AbstractTextareaPlugin.prototype.state_changed = function() {
	this.updateUi()
}

AbstractTextareaPlugin.prototype.updateUi = function() {
	if (!this.ui)
		return

	this.ui.update()
}

if (typeof(module) !== 'undefined')
	module.exports = AbstractTextareaPlugin

