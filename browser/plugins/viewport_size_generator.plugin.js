(function() {
	var ViewportSizeGenerator = E2.plugins.viewport_size_generator = function(core, node) {
		this.desc = 'Emits current renderer view size.'

		this.input_slots = []

		this.output_slots = [
			{
				name: 'width',
				dt: core.datatypes.FLOAT,
				desc: 'The current renderer viewport width.'
			}, {
				name: 'height',
				dt: core.datatypes.FLOAT,
				desc: 'The current renderer viewport height.'
			}
		]
	}

	ViewportSizeGenerator.prototype.update_output = function (slot) {
		if (slot.name === 'width') {
			return this.domElement.width
		}
		else {
			return this.domElement.height
		}
	}

	ViewportSizeGenerator.prototype.resize = function () {
		this.updated = true
	}

	ViewportSizeGenerator.prototype.state_changed = function(ui) {
		if (!ui) {
			this.domElement = E2.dom.webgl_canvas[0]
			E2.core.on('resize', this.resize.bind(this))
			E2.core.on('fullScreenChangeRequested', this.resize.bind(this))
		}
	}

})()
