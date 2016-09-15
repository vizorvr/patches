(function() {
	var ThreeTextGeometry = E2.plugins.three_text_geometry = function (core) {
		Plugin.apply(this, arguments)

		this.input_slots = [{
			name: 'text',
			dt: E2.dt.TEXT,
			def: 'hello world'
		}, {
			name: 'size',
			dt: E2.dt.FLOAT,
			def: 1
		}, {
			name: 'segments',
			dt: E2.dt.FLOAT,
			def: 4/*,
			validate: function(v) {return Math.floor(Math.min(Math.max(1, v), 10))}*/
		}, {
			name: 'line spacing',
			dt: E2.dt.FLOAT,
			def: 1
		}, {
			name: 'max line length',
			dt: E2.dt.FLOAT,
			def: 80
		}]

		this.output_slots = [{
			name: 'geometry', dt: core.datatypes.GEOMETRY
		}]

		this.fontSelector = new FontSelector()

		this.state = {
			fontId: this.fontSelector.getByIndex(0).id
		}

		this.desc = 'Generate text'
	}

	ThreeTextGeometry.prototype = Object.create(Plugin.prototype)
	ThreeTextGeometry.prototype.constructor = Plugin.prototype

	ThreeTextGeometry.prototype.create_ui = function() {
		var $ui = make('div')

		var that = this

		this.fontSelector.createUi($ui, function(newFont, newSelection) {
			that.undoableSetState('fontId', newSelection, that.state.fontId)
			that.font = newFont
		})

		return $ui
	}

	ThreeTextGeometry.prototype.reset = function() {
		this.geometry = new THREE.Geometry()
		this.dirty = true
	}

	ThreeTextGeometry.prototype.update_input = function(slot, data) {
		this.dirty = true
	}

	ThreeTextGeometry.prototype.update_output = function() {
		return this.geometry
	}

	ThreeTextGeometry.prototype.reconstructGeometry = function() {
		var parameters = {
			curveSegments: this.inputValues.segments,
			size: this.inputValues.size,
		}

		var lines = this.inputValues.text.split('\n')

		var shapes = []

		var lineHeight = this.inputValues['line spacing'] * this.inputValues.size

		this.geometry = undefined

		var maxLength = this.inputValues['max line length']

		for (var i = 0; i < lines.length; ++i) {
			if (lines[i].length > maxLength) {
				var line = lines[i]

				var splitAt = line.lastIndexOf(' ', maxLength)

				if (splitAt === -1) {
					// try to find after the break point
					splitAt = line.indexOf(' ', maxLength)
				}

				if (splitAt > 0) {
					lines[i] = line.substring(0, splitAt)

					lines.splice(i + 1, 0, line.substring(splitAt + 1))
				}
			}

			var lineShapes = this.font.font.generateShapes(lines[i], parameters.size, parameters.curveSegments)

			if (this.geometry) {
				var mtx = new THREE.Matrix4().makeTranslation(0, lineHeight, 0)
				this.geometry.applyMatrix(mtx)

				this.geometry.addShapeList( lineShapes );
			}
			else {
				this.geometry = new THREE.ShapeGeometry(lineShapes)
			}
		}

		this.geometry.computeFaceNormals()

		this.dirty = false

		this.updated = true
	}

	ThreeTextGeometry.prototype.update_state = function() {
		if (!this.font || !this.font.font || (this.state.fontId !== this.font.font.id)) {
			if (this.loadPromise) {
				return
			}

			this.font = this.fontSelector.getById(this.state.fontId)

			if (!this.font.font) {
				var that = this

				var dfd = when.defer()

				var doLoad = function() {
					that.fontSelector.fontLoader.load(that.font.url, function(font) {
						that.font.font = font
						that.reconstructGeometry()

						dfd.resolve()
					})
				}

				if (this.loadPromise) {
					this.loadPromise.then(doLoad)
				}
				else {
					this.loadPromise = dfd.promise

					doLoad()
				}

				this.loadPromise.then(function() {
					that.loadPromise = undefined
				})

				return
			}
		}
		else if (!this.dirty) {
			return
		}

		this.reconstructGeometry()
	}

	ThreeTextGeometry.prototype.state_changed = function(ui) {
		if (ui) {
			this.fontSelector.initialise(ui, this.state.fontId)
			return
		}
	}
})()
