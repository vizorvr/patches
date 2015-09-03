(function() {

var EnvelopePlugin = E2.plugins.envelope_modulator = function EnvelopePlugin(core, node) {
	Plugin.apply(this, arguments)

	this.desc = 'Envelope modulator'
	
	this.input_slots = [
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'X value to pick Y with', def: 0 }
	]

	this.output_slots = [
		{ name: 'y', dt: core.datatypes.FLOAT, desc: 'The value at x', def: 0 }
	]

	this.x = this.value = 0.0

	this.state = { points: [ [0, 0], [1, 1] ]  } // default line bottom left to top right

	this.node = node
	this._core = core

	this.loaded = false
}

EnvelopePlugin.prototype = Object.create(Plugin.prototype)

EnvelopePlugin.prototype.create_ui = function() {
	var that = this

	if (this._$ui)
		return this._$ui

	var $ui = this._$ui = $('<div class="envelope-editor">')

	this._loadScripts(function() {
		that._loaded = true
		that._redrawEditor()

		that.node.on('pluginStateChanged', function() {
			that.dirty = that.updated = true
			that._editor
				.data(that.state.points)
				.redraw()
		})
	})

	return $ui
}

EnvelopePlugin.prototype.update_input = function(slot, data) {
	this.x = data % 1.0
}

EnvelopePlugin.prototype.update_state = function() {
	var l, r, lx = 0.0, rx = 1.0
	var x = this.x

	for (var i=0; i < this.state.points.length; i++) {
		var pt = this.state.points[i]

		if (pt[0] === x) {
			l = r = pt[1]
			break;
		}

		if (pt[0] < x) {
			lx = pt[0]
			l = pt[1]
			continue;
		}

		if (pt[0] > x) {
			rx = pt[0]
			r = pt[1]
			break;
		}
	}

	this.value = ((x-lx) * (r-l) / (rx-lx)) + l
}

EnvelopePlugin.prototype.update_output = function(slot) {
	return this.value
}

EnvelopePlugin.prototype.state_changed = function(ui) {
	if (ui) {
		if (!this._loaded)
			return;

	}
}

EnvelopePlugin.prototype._redrawEditor = function() {
	var that = this

	if (this._editor)
		this._editor.destroy()

	this._editor = new E2.EnvelopeEditor()

	this._editor
		.data(that.state.points)
		.render(this._$ui)
		.on('changed', function(d) {
			that.undoableSetState('points', d, that.state.points)
		})

}

EnvelopePlugin.prototype._loadScripts = function(cb) {
	var that = this
	this._core.add_aux_script('d3/d3.v3.min.js', function() {
		that._core.add_aux_script('envelope/envelopeEditor.js', cb)
	})
}


}) ();
