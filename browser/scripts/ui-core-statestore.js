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
 * owned by ui-core
 * first-level properties e.g. .mode, .visibility emit events upon changing
 * second-level properties through .visibility, .panelStates and .context also emit events
 * if persistentStorageRef, except for a number of ignored properties, the object will persist
 * @param persistentStorageRef (store or recall state)
 * @param context (data from a VizorUI.getContext() call)
 */
var UiState = function(persistentStorageRef, context) {
	EventEmitter.apply(this, arguments)
	var that = this

	var persistentStorageKey = 'uiState105'

	var defineProperty = function(obj, prop, options, callback) {
		options = _.extend({
			get: function() {
				return this._internal[prop]
			},
			set: function(v){
				var ov = this._internal[prop]
				if ( ! ((typeof(v) === 'object') || (typeof(v) === 'function'))) {
					if (v === ov) return	// nothing to do
				}
				this._internal[prop] = v
				if (callback) {
					callback(prop, v, ov)
				}
			}
		}, options)
		Object.defineProperty(obj, prop, options)
	}

	var defineGettersAndSetters = function(obj, callback) {
		// top-level setter (e.g. obj.property = value) generates a changed:property event
		for (var prop in obj._internal)
			if (obj._internal.hasOwnProperty(prop))
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

	this._internal = {
		modifyMode 	: uiModifyMode.move,			// does not autosave
		modifyModeDefault: 	uiModifyMode.move,		//	''	, recall when modifications(keydown) end (keyup)
		selectedObjects	: []						// [node, ...], does not autosave
	}

	var emitMain 		= makeEmitter(this)
	defineGettersAndSetters(this, emitMain)

	_.extend(this._internal, {
		mode 		: uiMode.build,
		visible 	: true,				// overall visibility of the UI
		context		: context || {},
		viewCamera	: uiViewCam.birdsEye,
		visibility	: {
			_internal: {
				breadcrumb: true,		// always true	(20151012)
				player_controls : true,	// always true	(20151012)
				main_toolbar : true,	// always true	(20151012)
				inspector	: false,	// not ours yet (20151123)
				timeline	: false		// (20151019)
			}
		},
		panelStates : {
			_internal: {
				chat:		null,
				patches:	null,
				assets:		null,
				properties: null
			}
		}
	})

	// read only
	Object.defineProperty(this, 'visibility', {
		get: function(){ return this._internal.visibility }
	})
	Object.defineProperty(this, 'panelStates', {
		get: function(){ return this._internal.panelStates }
	})


	var emitPanels 		= makeEmitter(this.panelStates, 'changed:panelStates'),
		emitVisibility 	= makeEmitter(this.visibility,'changed:visibility')
	defineGettersAndSetters(this.panelStates, emitPanels)
	defineGettersAndSetters(this.visibility, emitVisibility)


	_.extend(this._internal.visibility._internal,
		{
			floating_panels : true,
			panel_chat : false,
			panel_patches : true,
			panel_assets : true,
			patch_editor : false,
			panel_properties: false
		}
	)

	defineProperty(this, 'viewCamera', {
		get: function() { return this._internal.viewCamera },
		set: function(value) {
			if (value === this._internal.viewCamera) return
			this._internal.viewCamera = value
			that.emit('_internal:viewCamera', value)
			emitMain('viewCamera', this.viewCamera)
		}
	})


	defineProperty(this, 'mode', {
		get: function() {
			return this._internal.mode
		},
		set: function(value) {
			if (!this.visible) {	// nothing is visible, we expect patch editor or world editor
				this.visible = true;
				this.visibility.floating_panels = false;
			}
			if (value === this._internal.mode) return
			this._internal.mode = value

			switch (value) {
				case uiMode.build:
					this.visibility.patch_editor = false
					break
				case uiMode.program:
					this.visibility.patch_editor = true
					break
			}
			emitMain('mode', this.mode)
		}
	})

	var notifyBuildMode = function() {
		if (that.visibility._internal.patch_editor)
			that.mode = uiMode.program
		else 
			that.mode = uiMode.build
	}
	this.on('_internal:patch_editor', notifyBuildMode)
	this.on('_internal:viewCamera', notifyBuildMode)
	this.on('_internal:visible', notifyBuildMode)

	defineProperty(this, 'visible', {
		get: function() {
			return this._internal.visible && (this.visibility.floating_panels || this.visibility.patch_editor)
		},
		set: function(value) {	// this = state
			var old = this.visible
			if (value === old) return
			this._internal.visible = value
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
			emitVisibility('panel_patches', v.panel_patches)
			emitVisibility('panel_assets', v.panel_assets)
			emitVisibility('panel_properties', v.panel_properties)
			emitVisibility('floating_panels', v.floating_panels)
			emitVisibility('patch_editor', v.patch_editor)
			emitMain('visible', this.visible)
			emitMain('selectedObjects', this.selectedObjects)
		}
	})

	var notifyVisible = function(visible) {
		var v = that.visibility
		var isAnythingVisible = v._internal.patch_editor || v._internal.floating_panels

		if (isAnythingVisible && !that.visible) {
			that.visible = true
		}
		else if (that.visible && !isAnythingVisible) {
			that.visible = false
		}
		else
			emitMain('visible', that.visible)
	}
	this.on('_internal:patch_editor', notifyVisible)
	this.on('_internal:floating_panels', notifyVisible)

	defineProperty(this._internal.visibility, 'floating_panels', {
			get: function() {
				return that._internal.visible && this._internal.floating_panels
			},
			set: function(value) {	// this = state.visibility
				var old = this.floating_panels
				if (value === old) return

				this._internal.floating_panels = value

				var oldVisible = that.visible
				that.emit('_internal:floating_panels', value)	// super

				if (value) {
					if (!oldVisible) {
						this.patch_editor = false
					}
					var noPanelsAreSetToVisible = !(this._internal.panel_chat ||
						this._internal.panel_patches ||
						this._internal.panel_assets ||
						this._internal.panel_properties)
					if (noPanelsAreSetToVisible) {
						// this.panel_assets = true // not in this build
						this.panel_chat = true
						this.panel_patches = true
						this.panel_properties = true
					}
				}

				emitVisibility('panel_chat', this.panel_chat)
				emitVisibility('panel_patches', this.panel_patches)
				emitVisibility('panel_assets', this.panel_assets)
				emitVisibility('panel_properties', this.panel_properties)
				emitVisibility('floating_panels', this.floating_panels)
			}
		}
	)

	var notifyFloatingPanels = function() {
		var v = that.visibility, _vi = that.visibility._internal
		var isAnyPanelVisible = (_vi.panel_chat || _vi.panel_patches || _vi.panel_assets || _vi.panel_properties)
		if (isAnyPanelVisible && !v.floating_panels) {
			v.floating_panels = true
		}
		else if (v.floating_panels && !isAnyPanelVisible) {
			v.floating_panels = false
		}
		else
			emitVisibility('floating_panels')
	}
	this.on('_internal:visibility:panel_chat', notifyFloatingPanels)
	this.on('_internal:visibility:panel_patches', notifyFloatingPanels)
	this.on('_internal:visibility:panel_assets', notifyFloatingPanels)
	this.on('_internal:visibility:panel_properties', notifyFloatingPanels)

	this.visibility._panelLogic = function(which, value) {
		// the one panel that is shown is set through internal
		// the other panels that aren't shown are set through their setters
		var old = this[which]
		if (value === old) return value

		var panels = ['panel_assets', 'panel_patches', 'panel_properties', 'panel_chat']
		var ix = panels.indexOf(which)
		if (ix === -1) {
			console.error('not found ' + which)
			return false
		}
		delete panels[ix]

		this._internal[which] = value
		var oldFloatingPanels = this.floating_panels
		that.emit('_internal:visibility:' + which, value)
		if (value && !oldFloatingPanels) {
			for (var p in panels) {
				this[panels[p]] = false
			}
		}
		var vv = this[which]
		emitVisibility(which, vv)
		return vv
	}

	defineProperty(this._internal.visibility, 'panel_properties', {
		get : function() {
			return this.floating_panels && this._internal.panel_properties
		},
		set: function(value) {
			return this._panelLogic('panel_properties', value)
		}
	})

	defineProperty(this._internal.visibility, 'panel_chat', {
			get: function() {
				return this.floating_panels && this._internal.panel_chat
			},
			set: function(value) {	// this = state._internal.visibility
				return this._panelLogic('panel_chat', value)
			}
		}
	)

	defineProperty(this._internal.visibility, 'panel_patches', {
			get: function() {
				return this.floating_panels && this._internal.panel_patches
			},
			set: function(value) {	// this = state.visibility
				return this._panelLogic('panel_patches', value)
			}
		}
	)

	defineProperty(this._internal.visibility, 'panel_assets', {
			get: function() {
				return this.floating_panels && this._internal.panel_assets
			},
			set: function(value) {	// this = state.visibility
				return this._panelLogic('panel_assets', value)
			}
		}
	)

	defineProperty(this._internal.visibility, 'patch_editor', {
			get: function() {
				return that._internal.visible && this._internal.patch_editor
			},
			set: function(value) {	// this = state.visibility
				var old = this.patch_editor
				if (value === old) return

				this._internal.patch_editor = value
				var oldVisible = that.visible
				that.emit('_internal:patch_editor', value)

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
		get: function() { return this._internal.context },
		set: function(context) {
			this._internal.context = context
			emitMain('context', context)
			emitPanels('chat', this.panelStates.chat)
			emitPanels('patches', this.panelStates.patches)
			emitPanels('assets', this.panelStates.assets)
			emitPanels('properties', this.panelStates.properties)
		}
	})

	this._storageRef = persistentStorageRef
	this._storageKey = persistentStorageKey
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

UiState.prototype.isBuildMode = function() {
	return this.mode === 'build'
}

UiState.prototype.isProgramMode = function() {
	return this.mode === 'program'
}

UiState.prototype.store = function() {
	this._save_t = null
	if (!this._storageRef) {
		msg("ERROR: storeState but no storageRef")
		return false
	}
	this._storageRef.setItem(this._storageKey, JSON.stringify(this.getCopy()))
	return true
}

UiState.prototype.recall = function() {
	if (!this._storageRef) return false
	var storage = this._storageRef
	var uiState = storage.getItem(this._storageKey)
	if (uiState) {
		var ok = this.setState(uiState)
		if (!ok)
			storage.removeItem(this._storageKey) // it refused so this is useless
	}
	return true
}

UiState.prototype.getCopy = function() {
	return {
		mode: this.mode,
		modifyMode: this.modifyMode,
		modifyModeDefault: this.modifyModeDefault,
		visible: this.visible,
		viewCamera: this.viewCamera,
		visibility: clone(this.visibility._internal),
		panelStates: clone(this.panelStates._internal),
		// selectedObjects: clone(this.selectedObjects),
		context: clone(this.context._internal)
	}
}

// note: overwrites the entire state, generating no events
UiState.prototype._apply = function(newState) {
	if (typeof newState !== 'object') return msg('ERROR: invalid newState')

	var internal = this._internal;
	var internalVisibility = internal.visibility._internal;
	var internalPanelStates = internal.panelStates._internal;

	// context is ignored but may be used for additional checks
	internal.visible = (typeof newState.visible === 'boolean') ? newState.visible : true
	var newVisibility = newState.visibility
	if (newState.mode) 			internal.mode = newState.mode
	if (newState.viewCamera) 	internal.viewCamera = newState.viewCamera

	if (newState.modifyModeDefault) 	{
		internal.modifyModeDefault = newState.modifyModeDefault
		internal.modifyMode = internal.modifyModeDefault
	}
	// selectedObjects ignored, and modifyMode set to default if one is given

	// take values from supplied visibility, but default to current
	for (var k in internalVisibility) {
		if (typeof newVisibility[k] !== 'undefined') internalVisibility[k] = newVisibility[k]
	}

	if (newState.panelStates)  {
		var ps = newState.panelStates
		if (ps.chat) 	internalPanelStates.chat = ps.chat
		if (ps.patches) internalPanelStates.patches = ps.patches
		if (ps.assets) 	internalPanelStates.assets = ps.assets
		if (ps.properties) 	internalPanelStates.properties = ps.properties
	}

	this.emit('replaced', this);

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
