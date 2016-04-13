(function() {
	var ThreeTextGeometry = E2.plugins.three_text_geometry = function (core) {
		Plugin.apply(this, arguments)

		this.input_slots = [{
			name: 'text',
			dt: E2.dt.TEXT,
			def: 'hello world'
		}, {
			name: 'font',
			dt: E2.dt.TEXT,
			def: 'helvetiker'
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
			name: 'weight',
			dt: E2.dt.TEXT,
			def: 'normal'
		}, {
			name: 'style',
			dt: E2.dt.TEXT,
			def: 'normal'
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

		this.desc = 'Generate text'
	}

	ThreeTextGeometry.prototype = Object.create(Plugin.prototype)
	ThreeTextGeometry.prototype.constructor = Plugin.prototype

	ThreeTextGeometry.prototype.reset = function() {
		this.dirty = true
	}


	ThreeTextGeometry.prototype.update_input = function(slot, data) {
		this.dirty = true
	}

	ThreeTextGeometry.prototype.update_output = function() {
		return this.geometry
	}

	ThreeTextGeometry.prototype.update_state = function() {
		if (!this.dirty) {
			return
		}

		var parameters = {
			font: this.inputValues.font,
			curveSegments: this.inputValues.segments,
			size: this.inputValues.size,
			weight: this.inputValues.weight,
			style: this.inputValues.style
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

			var lineShapes = THREE.FontUtils.generateShapes(lines[i], parameters)

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
	}
})()
