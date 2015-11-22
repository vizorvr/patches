var uiMode = {
	build: 	'build',
	program: 'program'
}
var uiModifyMode = {
	move: 	'translate',
	rotate: 'rotate',
	scale: 	'scale'
}

/**
 * first-level properties e.g. .mode, .visibility emit events upon changing
 * second-level properties through .visibility, .panelStates and .context also emit events
 * if persistentStorageRef, except for a number of ignored properties, the object will persist
 * @param persistentStorageRef (store or recall state)
 */
var UiState = function(persistentStorageRef, context) {
	EventEmitter.apply(this, arguments)
	var that = this

	var defineProperty = function(obj, prop, options, callback) {
		options = _.extend({
			get: function() {
				return this._[prop]},
			set: function(v){
				var ov = this._[prop]
				if (! (typeof v === 'object') || (typeof v === 'function')) {
					if (v === ov) return	// nothing to do
				}
				this._[prop] = v
				if (callback) {
					callback(prop, v, ov)
				}
			}
		}, options)
		Object.defineProperty(obj, prop, options)
	}

	var defineGettersAndSetters = function(obj, callback) {
		// top-level setter (e.g. obj.property = value) generates a changed:property event
		for (var prop in obj._)
			if (obj._.hasOwnProperty(prop))
				defineProperty(obj, prop, null, callback)
		return obj
	}

	// emit: 	'changed' , 'changed:{key}'
	//		or 	'changed' ,  eventName  ,  eventName:{key}
	var makeEmitter = function(obj, eventName) {
		return function(prop) {
			var value = obj[prop]
			that.emit('changed', obj, prop, value)
			if (eventName) {
				that.emit(eventName, prop, value)
				that.emit(eventName +':' +prop, value)
			} else {
				that.emit('changed:'+prop, value)
			}
		}
	}

	this._ = {
		modifyMode 	: uiModifyMode.move,			// does not autosave
		selectedObjects	: []						// [node, ...], does not autosave
	}

	var emitMain 		= makeEmitter(this)
	defineGettersAndSetters(this, emitMain)


	_.extend(this._, {
		mode 		: uiMode.build,
		visible 	: true,				// overall visibility of the UI
		context		: context || {},
		viewCamera	: uiViewCam.world_editor,
		visibility	: {
			_: {
				breadcrumb: true,		// always true	(20151012)
				player_controls : true,	// always true	(20151012)
				main_toolbar : true,	// always true	(20151012)
				inspector	: false,	// always false (20151012)
				timeline	: false		// (20151019)
			}
		},
		panelStates : {
			_: {
				chat:		null,
				presets:	null,
				assets:		null
			}
		}
	})

	// read only
	Object.defineProperty(this, 'visibility', {
		get: function(){ return this._.visibility }
	})
	Object.defineProperty(this, 'panelStates', {
		get: function(){ return this._.panelStates }
	})


	var emitPanels 		= makeEmitter(this.panelStates, 'changed:panelStates'),
		emitVisibility 	= makeEmitter(this.visibility,'changed:visibility')
	defineGettersAndSetters(this.panelStates, emitPanels)
	defineGettersAndSetters(this.visibility, emitVisibility)


	_.extend(this._.visibility._,
		{
			floating_panels : true,
			panel_chat : true,
			panel_presets : true,
			panel_assets : true,
			patch_editor : true
		}
	)

	defineProperty(this, 'viewCamera', {
		get: function() { return this._.viewCamera },
		set: function(value) {
			if (value === this._.viewCamera) return
			this._.viewCamera = value
			emitMain('viewCamera', this.viewCamera)
		}
	})

	defineProperty(this, 'mode', {
		get: function() { return this._.mode },
		set: function(value) {
			if (value === this._.mode) return
			this._.mode = value
			emitMain('mode', this.mode)
			switch (value) {
				case uiMode.build:
					this.viewCamera = uiViewCam.world_editor
					this.visibility.patch_editor = false
					break
				case uiMode.program:
					this.viewCamera = uiViewCam.vr
					this.visibility.patch_editor = true
					break
			}
		}
	})

	defineProperty(this, 'visible', {
		get: function() {
			return this._.visible && (this.visibility.floating_panels || this.visibility.patch_editor)
		},
		set: function(value) {	// this = state
			var old = this.visible
			if (value === old) return
			this._.visible = value
			var v = this.visibility
			if (value) {	// off -> on
				var nothingVisible = !(v.floating_panels || v.patch_editor)
				if (nothingVisible) {
					switch (this.mode) {
						case uiMode.program:
							v.patch_editor = true
							break
						case uiMode.build:
							v.floating_panels = true
							break
					}
				}
			}
			emitVisibility('panel_chat', v.panel_chat)
			emitVisibility('panel_presets', v.panel_presets)
			emitVisibility('panel_assets', v.panel_assets)
			emitVisibility('floating_panels', v.floating_panels)
			emitVisibility('patch_editor', v.patch_editor)
			emitMain('visible', this.visible)
			emitMain('mode', this.mode)
			emitMain('selectedObjects', this.selectedObjects)
		}
	})

	var notifyVisible = function(visible) {
		var v = that.visibility
		var isAnythingVisible = v._.patch_editor || v._.floating_panels

		if (isAnythingVisible && !that.visible) {
			that.visible = true
		}
		else if (that.visible && !isAnythingVisible) {
			that.visible = false
		}
		else
			emitMain('visible', that.visible)
	}
	this.on('_:patch_editor', notifyVisible)
	this.on('_:floating_panels', notifyVisible)

	defineProperty(this._.visibility, 'floating_panels', {
			get: function() {
				return that._.visible && this._.floating_panels
			},
			set: function(value) {	// this = state.visibility
				var old = this.floating_panels
				if (value === old) return

				this._.floating_panels = value

				var oldVisible = that.visible
				that.emit('_:floating_panels', value)	// super

				if (value) {
					if (!oldVisible) {
						this.patch_editor = false
					}
					var noPanelsAreSetToVisible = !(this._.panel_chat || this._.panel_presets || this._.panel_assets)
					if (noPanelsAreSetToVisible) {
						// this.panel_assets = true // not in this build
						this.panel_chat = true
						this.panel_presets = true
					}
				}

				emitVisibility('panel_chat', this.panel_chat)
				emitVisibility('panel_presets', this.panel_presets)
				emitVisibility('panel_assets', this.panel_assets)
				emitVisibility('floating_panels', this.floating_panels)
			}
		}
	)

	var notifyFloatingPanels = function(visible) {
		var v = that.visibility
		var isAnyPanelVisible = (v._.panel_chat || v._.panel_presets || v._.panel_assets)
		if (isAnyPanelVisible && !v.floating_panels) {
			v.floating_panels = true
		}
		else if (v.floating_panels && !isAnyPanelVisible) {
			v.floating_panels = false
		}
		else
			emitVisibility('floating_panels')
	}
	this.on('_:visibility:panel_chat', notifyFloatingPanels)
	this.on('_:visibility:panel_presets', notifyFloatingPanels)
	this.on('_:visibility:panel_assets', notifyFloatingPanels)

	defineProperty(this._.visibility, 'panel_chat', {
			get: function() {
				return this.floating_panels && this._.panel_chat
			},
			set: function(value) {	// this = state.visibility
				var old = this.panel_chat
				if (value === old) return

				this._.panel_chat = value
				var oldFloatingPanels = this.floating_panels
				that.emit('_:visibility:panel_chat', value)

				if (value) {
					if (!oldFloatingPanels) {
						this.panel_assets = false
						this.panel_presets = false
					}
				}

				emitVisibility('panel_chat', this.panel_chat)
			}
		}
	)

	defineProperty(this._.visibility, 'panel_presets', {
			get: function() {
				return this.floating_panels && this._.panel_presets
			},
			set: function(value) {	// this = state.visibility
				var old = this.panel_presets
				if (value === old) return

				this._.panel_presets = value
				var oldFloatingPanels = this.floating_panels
				that.emit('_:visibility:panel_presets', value)

				if (value) {
					if (!oldFloatingPanels) {
						this.panel_assets = false
						this.panel_chat = false
					}
				}
				emitVisibility('panel_presets', this.panel_presets)
			}
		}
	)

	defineProperty(this._.visibility, 'panel_assets', {
			get: function() {
				return this.floating_panels && this._.panel_assets
			},
			set: function(value) {	// this = state.visibility
				var old = this.panel_assets
				if (value === old) return

				this._.panel_assets = value
				var oldFloatingPanels = this.floating_panels
				that.emit('_:visibility:panel_presets', value)

				if (value) {
					if (!oldFloatingPanels) {
						this.panel_presets = false
						this.panel_chat = false
					}
				}
				emitVisibility('panel_assets', this.panel_assets)
			}
		}
	)

	defineProperty(this._.visibility, 'patch_editor', {
			get: function() {
				return that._.visible && this._.patch_editor
			},
			set: function(value) {	// this = state.visibility
				var old = this.patch_editor
				if (value === old) return

				this._.patch_editor = value
				var oldVisible = that.visible
				that.emit('_:patch_editor', value)

				if (value) {
					if (!oldVisible) {
						this.floating_panels = false
					}
				}
				emitVisibility('patch_editor', this.patch_editor)
			}
		}
	)

	defineProperty(this, 'context', {
		get: function() { return this._.context },
		set: function(context) {
			this._.context = context
			emitMain('context', context)
			emitPanels('chat', this.panelStates.chat)
			emitPanels('presets', this.panelStates.presets)
			emitPanels('assets', this.panelStates.assets)
		}
	})

	this._storageRef = persistentStorageRef
	this._save_t = null
	this.allowStoreOnChange = true

	if (this._storageRef) {
		var ignoredProperties = ['selectedObjects', 'modifyMode']
		this.on('changed', function(props, prop){
			if (!that.allowStoreOnChange) return
			if (ignoredProperties.indexOf(prop) > -1) return

			if (that._save_t) return	// a saveState is scheduled already
			that._save_t = setTimeout(function(){
				clearTimeout(that._save_t)
				that._save_t = null
				that.store()
			}, 500)	// schedule in a while
		})
	}
}

UiState.prototype = Object.create(EventEmitter.prototype)

UiState.prototype.store = function() {
	this._save_t = null
	if (!this._storageRef) {
		msg("ERROR: storeState but no storageRef")
		return false
	}
	this._storageRef.setItem('uiState100', JSON.stringify(this._getCopy()))
	return true
}

UiState.prototype.recall = function() {
	if (!this._storageRef) return false
	var storage = this._storageRef
	var uiState = storage.getItem('uiState100')
	if (uiState) {
		var ok = this.setState(uiState)
		if (!ok)
			storage.removeItem('uiState100') // it refused so this is useless
	}
	return true
}

UiState.prototype._getCopy = function() {
	return {
		mode: this.mode,
		modifyMode: this.modifyMode,
		visible: this.visible,
		viewCamera: this.viewCamera,
		visibility: clone(this.visibility._),
		panelStates: clone(this.panelStates._),
		// selectedObjects: clone(this.selectedObjects),
		context: clone(this.context._)
	}
}


UiState.prototype._apply = function(newState) {
	if (typeof newState !== 'object') return msg('ERROR: invalid newState')

	// context is ignored but may be used for additional checks
	this.visible = (typeof newState.visible === 'boolean') ? newState.visible : true
	var newVisibility = newState.visibility
	if (newState.mode) this.mode = newState.mode
	if (newState.viewCamera) this.viewCamera = newState.viewCamera

	// if (newState.modifyMode) this.modifyMode = newState.modifyMode
	// if (newState.selectedObjects instanceof Array) this.selectedObjects = newState.selectedObjects

	// take values from supplied visibility, but default to current
	for (var k in this.visibility._) {
		if (typeof newVisibility[k] !== 'undefined') this.visibility[k] = newVisibility[k]
	}

	if (!newState.panelStates) return true	// nothing else left to do

	var ps = newState.panelStates
	if (ps.chat) this.panelStates.chat = ps.chat
	if (ps.presets) this.panelStates.presets = ps.presets
	if (ps.assets) this.panelStates.assets = ps.assets

	return true
}


UiState.prototype.setState = function(stateObjOrJSON) {
	var newState
	try {
		newState = (typeof stateObjOrJSON === 'object') ? stateObjOrJSON : JSON.parse(stateObjOrJSON)
	}
	catch (e) {
		console.error(e)
		return msg('ERROR: failed parsing state json')
	}
	this._apply(newState)
	return true
}
