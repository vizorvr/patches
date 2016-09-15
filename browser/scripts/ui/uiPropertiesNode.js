var UINodeProperties = function UINodeProperties(domElement){

	UIAbstractProperties.apply(this, arguments)
	domElement = domElement || document.getElementById('nodePropertiesPane')

	this.dom = {
		container: $(domElement),
		common: {
			nodeName 		: false
		}
	}

	this.controls = {}

	this.template = E2.views.partials.editor.nodeInspector
	E2.ui.state.on('changed:selectedObjects', this.onSelectedNodeChanged.bind(this))

	this.emit('created')
	this.render()
}
UINodeProperties.prototype = Object.create(UIAbstractProperties.prototype)
UINodeProperties.prototype.constructor = UINodeProperties

UINodeProperties.prototype.onAttach = function() {
	var that = this
	var node = this.selectedGraphNode

	this.dom.common.nodeName = document.getElementById('propertiesNodeName')

	if (node) {
		var onRenamed = function() {
			that.controls.common.nodeName.onSourceChange()
		}
		node.on('renamed', onRenamed)
		this.detachQueue.push(function(){node.off('renamed', onRenamed)})
	}
}

UIObjectProperties.prototype.onDetach = function() {
	// the detach queue has already been executed
	delete this.controls
	delete this.adapter
	this.controls = {}
	this.adapter = {}
}

UINodeProperties.prototype.onSelectedNodeChanged = function() {
	this.render()
}

UINodeProperties.prototype.getAdapter = function() {
	var that = this

	var adapter = {
		common: {
			canEdit: true,
			get nodeName() {
				var n = that.selectedGraphNode
				if (n) {
					return n.get_disp_name()
				}
				return ''
			},
			set nodeName(v) {
				var n = that.selectedGraphNode
				if (!n) return null
				E2.app.graphApi.renameNode(E2.core.active_graph, n, v);
				return v
			}
		}
	}

	var node = this.selectedGraphNode

	if (node) {

		// eventually we have no state props
		var stateprops = node.getInspectorStateProps()
		if (!_.isEmpty(stateprops)) {
			adapter.stateProps = {}
			Object.keys(stateprops).forEach(function(name){
				var proxy = stateprops[name]		// a slot from node.getInspectorSlots {dt:,label:,canEdit:, value:}
				adapter.stateProps[name] = UINodeProperties.uifyStateProxy(node, name, proxy)
			})
		}

		var slotprops = node.getInspectorSlotProps()
		if (!_.isEmpty(slotprops)) {
			adapter.slotProps = {}
			Object.keys(slotprops).forEach(function(name){
				var proxy = slotprops[name]		// a slot from node.getInspectorSlots {dt:,label:,canEdit:, value:}
				adapter.slotProps[name] = that.uifySlotProxy(node, name, proxy)
			})
		}
	}

	return adapter
}


// as with prototype.uifySlot, this one goes via the undoManager
UINodeProperties.uifyStateProxy = function(node, varName, pluginStateProxy) {	//
	var proxy = pluginStateProxy
	Object.defineProperty(proxy, 'value', {
		get: function() {
			return proxy._value
		},
		set: function(v) {
			var ov = this._value
			if (proxy.canEdit)
				node.plugin.undoableSetState(varName, v, ov)
			return v
		}
	})
	Object.defineProperty(proxy, 'eventName', {value: 'pluginStateChanged'})
	return proxy
}

UINodeProperties.prototype.getControls = function() {
	var that = this
	var controls = {}
	var node = this.selectedGraphNode

	var makeControl = this._makeControl
	// props and state vars

	if (this.adapter.stateProps) {
		var np = this.adapter.stateProps
		controls.stateProps = {_enabled: true}

		Object.keys(np).forEach(function(key){
			var c = makeControl(node, np, key)
			if (!c) return
			that.detachQueue.push(c.destroy.bind(c))
			controls.stateProps[key] = {
				dtName: 	c.dt.name,
				label:  c.label,
				control: c
			}
		})
	}

	if (this.adapter.slotProps) {
		var sp = this.adapter.slotProps
		controls.slotProps = {_enabled: true}

		Object.keys(sp).forEach(function(key){
			var c = makeControl(node, sp, key)
			if (!c) return
			that.detachQueue.push(c.destroy.bind(c))
			controls.slotProps[key] = {
				dtName: 	c.dt.name,
				label:  c.label,
				control: c
			}
		})
	}

	if (node && this.adapter.common) {
		controls.common = {_enabled:true}
		var t = new UITextField(this.adapter.common, 'nodeName')
		this.detachQueue.push(t.destroy.bind(t))
		controls.common.nodeName = t
	}

	return controls
}

UINodeProperties.prototype.update = function() {	// soft updates the template already in place
	var that = this
	var canUpdate = this.isValidNodeSelection
	if (!canUpdate)
		return

	var updateControls = function(controlProps, adapterProps) {
		Object.keys(controlProps).forEach(function (key) {
			var control = controlProps[key].control
			if (!control) return	// e.g. [_enabled]
			control.onSourceChange()
			if (adapterProps[key].canEdit)
				control.enable()
			else
				control.disable()
		})
	}
	if (that.controls.stateProps)
		updateControls(that.controls.stateProps, that.adapter.stateProps)

	if (that.controls.slotProps)
		updateControls(that.controls.slotProps, that.adapter.slotProps)

	if (that.controls.common)
		updateControls(that.controls.common, that.adapter.common)

}