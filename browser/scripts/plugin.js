function Plugin(core, node) {
	var that = this
	this.core = core
	this.node = node

	this.state = {}
	this._oldState = {}

	this.node.on('pluginStateChanged', function() {
		if (that.state_changed && that.node.ui && that.node.ui.pluginUI)
			that.state_changed(that.node.ui.pluginUI)
	})

	this.inputValues = {}
}

Plugin.prototype.undoableSetState = function(key, newValue, oldValue) {
	E2.app.undoManager.execute(
		new E2.commands.graph.ChangePluginState(
			this.node.parent_graph,
			this.node,
			key,
			oldValue,
			newValue
	))
}

Plugin.prototype.transientSetState = function(key, newValue) {
	E2.app.dispatcher.dispatch({
		actionType: 'uiPluginTransientStateChanged',
		graphUid: this.node.parent_graph.uid,
		nodeUid: this.node.uid,
		key: key,
		value: newValue
	})
}

Plugin.prototype.reset = function() {
	var that = this
	this.inputValues = {}
	this.input_slots.map(function(slot) {
		var def = slot.def !== undefined ? slot.def : that.core.get_default_value(slot.dt)
		that.inputValues[slot.name] = def
	})
}

Plugin.prototype.update_input = function(slot, data) {
	this.inputValues[slot.name] = data
}


Plugin.prototype.beginBatchModifyState = function() {
	var that = this, state = that.state, oldState = that._oldState
	if (oldState) {
		Object.keys(oldState).forEach(function(prop) {
			delete oldState[prop]
		})
	} else {
		oldState = this._oldState = {}
	}

	Object.keys(state).forEach(function(prop) {
		oldState[prop] = state[prop]
	})
	return true
}

Plugin.prototype.endBatchModifyState = function(stepName) {
	var that = this, state = that.state, oldState = that._oldState
	if ( !oldState  ||  Object.keys(oldState).length === 0 ) return
	E2.app.undoManager.begin(stepName)
	Object.keys(state).forEach(function(prop) {
		if (oldState[prop] !== state[prop] ) {
			that.undoableSetState(prop, state[prop], oldState[prop])
		}
	})
	E2.app.undoManager.end()

	Object.keys(oldState).forEach(function(prop) {
		delete oldState[prop]
	})
	return true
}

if (typeof(module) !== 'undefined')
	module.exports = Plugin
