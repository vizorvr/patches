function Plugin(core, node) {
	var that = this
	this.core = core
	this.node = node

	// though Node.js sets this too,
	// this is still needed here 
	// in case it's referred to in instantiation
	this.inputValues = {}

	this.state = {}
	this._oldState = {}

	this.node.on('pluginStateChanged', function() {
		if (that.state_changed && that.node.ui && that.node.ui.pluginUI)
			that.state_changed(that.node.ui.pluginUI)
	})
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

// these two are now in Node.js
// but stubs are required here for inheritance
Plugin.prototype.reset = function() {
}
Plugin.prototype.update_input = function() {}

Plugin.prototype.beginBatchModifyState = function() {
	this._oldState = _.clone(this.state)
	return true	// allow use as event handler
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

	this._oldState = {}
	return true
}

if (typeof(module) !== 'undefined')
	module.exports = Plugin
