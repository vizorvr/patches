function AbstractThreeLoaderObjPlugin(core) {
	Plugin.apply(this, arguments)
	this.desc = 'THREE.js OBJ loader'
	
	this.dirty = true

	this.childrenByMaterialName = {}
	this.state = { url: '' }
	this.materials = {}

	this.input_slots = []

	this.output_slots = [{
		name: 'geometry',
		dt: core.datatypes.GEOMETRY,
		array: true
	},
	{
		name: 'materials',
		dt: core.datatypes.MATERIAL,
		array: true
	}]

	this.geometries = [new THREE.Geometry()]
	this.materials = [new THREE.MeshBasicMaterial(0xff0000)]
}

AbstractThreeLoaderObjPlugin.prototype = Object.create(Plugin.prototype)

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
	/*if (slot.uid) {
		this.materials[slot.name] = data

		if (!this.childrenByMaterialName[slot.name]) {
			if (!this.geometries) {
				// object hasn't finished loading yet - add to pending list
				this.pendingMaterialInput = this.pendingMaterialInput || {}

				this.pendingMaterialInput[slot.name] = data
			}

			return;
		}

		for (var i=0; i < this.childrenByMaterialName[slot.name].length; i++)
			this.childrenByMaterialName[slot.name][i].material = data

		return;
	}

	return ThreeObject3DPlugin.prototype.update_input.apply(this, arguments)
	*/
}
/*
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
*/

AbstractThreeLoaderObjPlugin.prototype.onObjLoaded = function(geoms, mats) {
	this.geometries = geoms
	this.materials = mats

	msg('Finished loading '+ this.state.url)

	this.childrenByMaterialName = {}
/*
	for (var i = 0; i < this.geometries.length; i++) {
		var geom = this.geometries[i]

		if (geom.material.name) {
			var matName = 'mat-'+geom.material.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g,' ')
				.replace(/ +/g, '-')

			if (!this.childrenByMaterialName[matName])
				this.childrenByMaterialName[matName] = []

			this.childrenByMaterialName[matName].push(geom)
		}
	}

	if (this.pendingMaterialInput) {
		for (input in Object.keys(this.pendingMaterialInput)) {
			for (var i=0; i < this.childrenByMaterialName[input].length; i++)
				this.childrenByMaterialName[input][i].material = this.pendingMaterialInput[input]

			this.pendingMaterialInput.remove(input)
		}
	}
*/
	//this.adjustMaterialSlots()

	this.updated = true
}

AbstractThreeLoaderObjPlugin.prototype.update_state = function() {
	if (!this.dirty)
		return

	if (!this.state.url)
		return;

	if (this.geometries)
		this.geometries = null

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

