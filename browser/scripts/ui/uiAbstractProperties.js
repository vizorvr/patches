/**
 * exposes in UI a set of properties belonging to the selected object or node
 * these are wired via get/set proxies
 */
var UIAbstractProperties = function UIAbstractProperties(domElement) {
	EventEmitter.apply(this, arguments)
	var that = this

	this.attached = false
	this.updateQueued = false
	this.detachQueue = []

	this.dom = {
		container: null		// typically $(domElement)
	}

	// holds references to any custom UI control objects, controlling this.adapter via dom events
	this.controls = {}

	// collects exposed properties. set at render-time
	this.adapter = null

	Object.defineProperty(this, 'selectedEditorObjectMeshNode', {
		get: function() {
			var p = E2.app.worldEditor.getSelectedObjectPlugin()
			return p ? p.parentNode : p
		}
	})

	Object.defineProperty(this, 'selectedEditorObjectMeshPlugin', {
		get: function() {
			return E2.app.worldEditor.getSelectedObjectPlugin()
		}
	})

	// one graph node or nothing
	Object.defineProperty(this, 'selectedGraphNode', {
		get: function() {
			var sel = E2.ui.state.selectedObjects
			return (sel &&  sel.length === 1) ? sel[0] : null
		}
	})

	Object.defineProperty(this, 'selectedIsCamera', {
		get: function() {
			var sel = this.selectedEditorObjectMeshPlugin
			return sel && (sel.id === 'three_vr_camera')
		}
	})

	// convenience methods

	Object.defineProperty(this, 'isValidObjectSelection', {
		get: function() {
			return !!this.selectedEditorObjectMeshPlugin
		}
	})

	Object.defineProperty(this, 'isValidNodeSelection', {
		get: function() {
			return !!this.selectedGraphNode
		}
	})

	Object.defineProperty(this, 'isInBuildMode', {
		get: function() {
			return E2.ui.isInBuildMode()
		}
	})
	
	E2.ui.state.on('changed:mode', this.render.bind(this))
	E2.ui.on('undo', this.onUndo.bind(this))
	E2.ui.on('redo', this.onRedo.bind(this))
}
UIAbstractProperties.prototype = Object.create(EventEmitter.prototype)
UIAbstractProperties.prototype.constructor = UIAbstractProperties

UIAbstractProperties.prototype.onUndo = function() {
	this.render()
}
UIAbstractProperties.prototype.onRedo = UIAbstractProperties.prototype.onUndo

// sometimes we need to wait the graph to complete a cycle so we request a call on next frame
UIAbstractProperties.prototype.queueUpdate = function() {
	if (this.updateQueued) return
	this.updateQueued = true
	var that = this
	requestAnimFrame(function(){
		that.updateQueued = false
		if (that.attached)
			that.update()
		else
			console.error('queueUpdate() not attached?')
	})
}

// resets panel, clearing container, refreshing adapter, and controls, and rerendering template
UIAbstractProperties.prototype.render = function() {
	this._detach()
	var canRender = this.isValidNodeSelection || this.isValidObjectSelection
	if (canRender) {
		this.adapter = this.getAdapter()
		this.controls = this.getControls()
		var props = this.getTemplateData()	// formatted etc
	} else {
		var props = {}
		this.adapter = {}
		this.controls = {}
	}

	this.dom.container.empty()
	this.dom.container.html(this.template({
		adapter : this.adapter,
		controls: this.controls,
		properties: props
	}))

	VizorUI.replaceSVGButtons(this.dom.container)

	this._attach()
	this.emit('rendered')

	this.update()

	return this
}

UIAbstractProperties.prototype._detach = function() {

	$('*', this.dom).off('.uiProperties')

	if (this.detachQueue && this.detachQueue.length) {
		var removeHandler
		while (removeHandler = this.detachQueue.pop()) {
			removeHandler()
		}
	}

	this.onDetach()

	this.emit('detached')
	this.attached = false

}

UIAbstractProperties.prototype.watchConnectionUpdates = function(node) {

	var update = this.render.bind(this)	// heavyhanded but object3d doesnt work otherwise

	node.on('connected', update)
	node.on('disconnected', update)

	this.detachQueue.push(function () {
		node.off('disconnected', update)
		node.off('connected', update)
	})

}

UIAbstractProperties.prototype._attach = function() {
	// if anything is connected we wait a frame
	if (this.selectedGraphNode) {
		this.watchConnectionUpdates(this.selectedGraphNode)
	}
	this.onAttach()
	this.emit('attached')
	this.attached = true
}

UIAbstractProperties.prototype._reset = function() {	// resets handling, clears interface
	this.onReset()
	this._detach()
	this.adapter = {}
	this.controls = {}
	this.emit('reset')
	return this
}

// makes a control based on an adapter prop
/**
 * {e.g.
 *  position: {
 *    value:
 *    canEdit: (bool)
 *    label: (string)
 *    dt: (e2.core.datatypes)
 *  }
 * }
 * @param props (adapter)
 * @param propName (e.g. 'position' for adapter.position)
 * @param onChange (optional callback)
 * @private
 */
UIAbstractProperties.prototype._makeControl = function(node, props, propName, onChange, opts) {
	var controlType = VizorUI.getControlTypeForDt(props[propName].dt)
	if (!controlType) {
		console.error('could not get control type for dt of prop:'+propName, props)
		return
	}
	if (!props[propName]) {
		console.error('no ' + propName + ' in slotProps', props)
		return
	}
	var prop = props[propName]
	var control = new controlType(prop, 'value', null, onChange, opts)
	var changeHandler = function(key){
		if (key.name && key.name !== propName) return	// this is a slot and it's not for us
		control.onSourceChange()
	}
	if (node) {
		control.__attach = control.attach
		control.attach = function () {
			control.__attach()
			node.on(prop.eventName, changeHandler)
		}
		control.__detach = control.detach
		control.detach = function () {
			node.off(prop.eventName, changeHandler)
			control.__detach()
		}
	}
	if (prop.canEdit !== undefined) {
		if (!prop.canEdit) control.disable()
	}

	control.label 	= prop.label
	control.dt 		= prop.dt
	return control
}

// make the UI conform to the protocol loop (emit event, update on receive)
// we can read direct from the proxy, but setting the values has to go via the graph API
// when the node actually changes its input slot value (via graph call / event), control must update
UIAbstractProperties.prototype.uifySlotProxy = function(node, slotName, inputSlotProxy) {	//
	var proxy = inputSlotProxy
	if (!(proxy instanceof Object)) {
		console.error('proxy not an object', proxy)
		return
	}
	Object.defineProperty(proxy, 'value', {
		get: function() {
			return proxy.canEdit ? proxy._value : proxy.default
		},
		set: function(v) {
			if (proxy.canEdit)
				E2.app.graphApi.changeInputSlotValue(node.parent_graph, node, slotName, v)
			return v
		}
	})
	Object.defineProperty(proxy, 'eventName', {value: 'uiSlotValueChanged'})	// control will listen to this
	return proxy
}

/********* methods to implement ***********/

/* recommend implementing */
				UIAbstractProperties.prototype.getTemplateData = function() {return this.adapter}

// the adapter bridges values for the selected object's state or properties, and the UI controls
/* @abstract */ UIAbstractProperties.prototype.getAdapter = function() {return {}}
/* @abstract */ UIAbstractProperties.prototype.getControls = function() {return {}}
/* @abstract */ UIAbstractProperties.prototype.onAttach 	= function() {}
/* @abstract */ UIAbstractProperties.prototype.onDetach 	= function() {}	// this.detachQueue is automatically processed
/* @abstract */ UIAbstractProperties.prototype.onReset 	= function() {}
/* @abstract */ UIAbstractProperties.prototype.update 	= function() {}	// soft-update this.dom{} in place
