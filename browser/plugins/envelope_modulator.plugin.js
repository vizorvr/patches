(function() {

var EnvelopePlugin = E2.plugins['envelope_modulator'] = function EnvelopePlugin(core, node) {
	this.desc = 'Envelope modulator'
	
	this.input_slots = [
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'X value to pick Y with', def: 0 }
	]

	this.output_slots = [
		{ name: 'y', dt: core.datatypes.FLOAT, desc: 'The value at x', def: 0 }
	]

	this.x = this.value = 0.0

	this.state = { points: [ [0, 0], [1, 1] ]  } // default line bottom left to top right

	this._core = core
}

EnvelopePlugin.prototype.create_ui = function() {
	var that = this

	if (this._$ui)
		return this._$ui

	var $ui = this._$ui = $('<div class="envelope-editor">')

	this._loadScripts(function() {
		new E2.EnvelopeEditor()
			.data(that.state.points)
			.render($ui)
			.on('changed', function(d) {
				that.state.points = d
				that.dirty = that.updated = true
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



EnvelopePlugin.prototype._loadScripts = function(cb) {
	var that = this
	this._core.add_aux_script('d3/d3.v3.min.js', function() {
		that._core.add_aux_script('envelope/envelopeEditor.js', cb)
	})
}





}) ()
