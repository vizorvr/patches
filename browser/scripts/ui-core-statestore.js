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
var UiStateStore = function(persistentStorageRef, context) {
	EventEmitter.apply(this, arguments)
	var that = this

	var defineGettersAndSetters = function(obj, properties, callback) { // ES5
		// top-level setter (e.g. obj.property = value) generates a changed:property event
		obj._ = properties
		var defineProperty = function(o, prop) {
			Object.defineProperty(o, prop, {
				get: function(){return this._[prop]},
				set: function(v){
					var ov = this._[prop]
					this._[prop] = v
					if (callback) {
						callback(this._, prop, v, ov)
					}
				}
			})
		}
		var prop
		for (prop in obj._) {
			if (obj._.hasOwnProperty(prop))
				defineProperty(obj, prop)
		}
		return obj
	}

	// emit: 	'changed' , 'changed:{key}'
	//		or 	'changed' ,  eventName  ,  eventName:{key}
	var emit = function(eventName) {
		return function(obj, k, v, ov) {
			if ((typeof v !== 'object') && (typeof v !== 'function')) {
				if (v === ov) return	// nothing to do
			}
			that.emit('changed', obj, k, v, ov)

			if (eventName) {
				that.emit(eventName, k, v, ov)
				that.emit(eventName +':' +k, v)
			} else {
				that.emit('changed:'+k, v, ov)
			}
		}
	}

    defineGettersAndSetters(this,{
		mode 		: uiMode.build,
		visible		: true,							// overall visibility of the UI
		modifyMode 	: uiModifyMode.move,			// does not autosave
		viewCamera	: uiViewCam.world_editor,
		visibility	: {},
		panelStates : {},
		selectedObjects	: [],						// [node, ...], does not autosave
		context 	: context || {}
	}, emit())
	defineGettersAndSetters(this._.visibility, {
		floating_panels: true,
		panel_chat: true,
		panel_assets: false,
		panel_presets: true,
		patch_editor: false,
		breadcrumb: true,		// always true	(20151012)
		player_controls : true,	// always true	(20151012)
		main_toolbar : true,	// always true	(20151012)
		inspector	: false,	// always false (20151012)
		timeline	: false		// (20151019)
	}, emit('changed:visibility'))

	defineGettersAndSetters(this._.panelStates, {
		chat:		null,
		presets:	null,
		assets:		null
	}, emit('changed:panelStates'))

	this._storageRef = persistentStorageRef
	this._save_t = null
	this.allowStoreOnChange = true

	if (this._storageRef) {
		var ignoredProperties = ['selectedObjects', 'modifyMode'];
		this.on('changed', function(props, prop){
			if (!that.allowStoreOnChange) return;
			if (ignoredProperties.indexOf(prop) > -1) return;

			if (that._save_t) return	// a saveState is scheduled already
			that._save_t = setTimeout(function(){
				clearTimeout(that._save_t)
				that._save_t = null
				that.store()
			}, 500)	// schedule in a while
		})
	}
}

UiStateStore.prototype = Object.create(EventEmitter.prototype)

UiStateStore.prototype.store = function() {
	this._save_t = null
	if (!this._storageRef) {
		msg("ERROR: storeState but no storageRef")
		return false
	}
	this._storageRef.setItem('uiState100', JSON.stringify(this._getCopy()))
	return true
}

UiStateStore.prototype.recall = function() {
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

UiStateStore.prototype._getCopy = function() {
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


UiStateStore.prototype._apply = function(newState) {
	if (typeof newState !== 'object') return msg('ERROR: invalid newState')

	// context is ignored but may be used for additional checks
	this.visible = (typeof newState.visible === 'boolean') ? newState.visible : true;
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


UiStateStore.prototype.setState = function(stateObjOrJSON) {
	var newState;
	try {
		newState = (typeof stateObjOrJSON === 'object') ? stateObjOrJSON : JSON.parse(stateObjOrJSON);
	}
	catch (e) {
		console.error(e);
		return msg('ERROR: failed parsing state json');
	}
	this._apply(newState);
	return true;
}
