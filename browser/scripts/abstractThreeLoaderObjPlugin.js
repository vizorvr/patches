function AbstractThreeLoaderObjPlugin(core) {
	ThreeObject3DPlugin.apply(this, arguments)

	this.desc = 'THREE.js OBJ loader'
	
	// add slots above the ones from ThreeObject3DPlugin
	this.input_slots.unshift({ name: 'url', dt: core.datatypes.TEXT })

	this.dirty = true

	this.state = { url: '' }

	this.childrenByMaterialName = {}
	this.materials = {}
}

AbstractThreeLoaderObjPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

AbstractThreeLoaderObjPlugin.prototype.create_ui = function() {
	var inp = makeButton('Change', 'No scene selected.', 'url')
	var that = this
	
	inp.click(function() {
		var oldValue = that.state.url
		var newValue

		FileSelectControl
			.createSceneSelector(that.state.url)
			.onChange(function(v) {
				newValue = that.state.url = v
				that.state_changed(null)
				that.state_changed(inp)
				that.updated = true
			})
			.on('closed', function() {
				if (newValue === oldValue)
					return
				console.log('closed', newValue, that.state.url)
				that.undoableSetState('url', newValue, oldValue)
			})
	})

	return inp
}

AbstractThreeLoaderObjPlugin.prototype.update_input = function(slot, data) {
	if (slot.uid) {
		this.materials[slot.name] = data

		if (!this.childrenByMaterialName[slot.name])
			return;

		for (var i=0; i < this.childrenByMaterialName[slot.name].length; i++)
			this.childrenByMaterialName[slot.name][i].material = data

		return;
	}

	return ThreeObject3DPlugin.prototype.update_input.apply(this, arguments)
}

AbstractThreeLoaderObjPlugin.prototype.adjustMaterialSlots = function() {
	var that = this
	var materialSlots = this.node.getDynamicInputSlots()
	var materialNames = Object.keys(this.childrenByMaterialName)

	// filter out any old material slots that don't belong to this obj
	materialSlots.slice().map(function(mSlot) {
		if (materialNames.indexOf(mSlot.name) === -1) {
			that.node.remove_slot(E2.slot_type.input, mSlot.uid)
		}
	})

	// then check that all the material slots of this obj are there
	materialNames.map(function(matName) {
		var found = materialSlots.some(function(mSlot) {
			return (mSlot.name === matName)
		})

		if (found)
			return;

		var slotUid = that.node.uid + matName

		that.node.add_slot(E2.slot_type.input, {
			dt: E2.dt.MATERIAL,
			uid: slotUid,
			name: matName
		})
	})
}

AbstractThreeLoaderObjPlugin.prototype.onObjLoaded = function(obj) {
	var that = this

	this.object3d = obj

	msg('Finished loading '+ this.state.url)

	this.childrenByMaterialName = {}

	obj.traverse(function(child) {
		if (child instanceof THREE.Mesh && child.material.name) {
			var matName = 'mat-'+child.material.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g,' ')
				.replace(/ +/g, '-')

			if (!that.childrenByMaterialName[matName])
				that.childrenByMaterialName[matName] = []

			that.childrenByMaterialName[matName].push(child)
		}
	})

	this.adjustMaterialSlots()

	this.updated = true
}

AbstractThreeLoaderObjPlugin.prototype.update_state = function() {
	if (!this.dirty)
		return

	if (!this.state.url)
		return;

	if (this.object3d)
		this.object3d = null

	THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader())

	console.log('AbstractThreeLoaderObjPlugin loading', this.state.url)

	this.loadObj()

	this.dirty = false
}

AbstractThreeLoaderObjPlugin.prototype.loadObj = function() {
	var that = this
	var loader = new THREE.OBJLoader()
	loader.load(this.state.url, this.onObjLoaded.bind(this), function() {
		console.log('Loading progress', that.state.url, arguments)
	}, function(err) {
		msg('ERROR: '+err.toString())
	})
}

AbstractThreeLoaderObjPlugin.prototype.state_changed = function(ui) {
	console.log('state_changed', this.state)
	if (!this.state.url)
		return

	if (ui)
		ui.attr('title', this.state.url)
	else
		this.dirty = true
}

