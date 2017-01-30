(function() {
	var ThreeGazeClicker = E2.plugins.three_gaze_clicker = function(core) {
		this.desc = 'Gaze Clicker'
		Plugin.apply(this, arguments)

		this.core = core

		this.iconDistance = 0.030

		this.input_slots = [
			{name: 'camera', dt: core.datatypes.CAMERA},
			{name: 'scene', dt: core.datatypes.SCENE},
			{name: 'delay', dt: core.datatypes.FLOAT, def: 1.0},
			{name: 'show icon', dt: core.datatypes.BOOL, def: true},
			{name: 'eye distance', dt: core.datatypes.FLOAT, def: this.iconDistance,
			 desc: 'Eye Distance for Gaze Clicker icon in VR'}
		]

		this.output_slots = [
			{name: 'scene', dt: core.datatypes.SCENE},
			{name: 'object', dt: core.datatypes.OBJECT3D}
		]

		this.always_update = true
		this.showIcon = true
	}

	ThreeGazeClicker.prototype = Object.create(Plugin.prototype)

	ThreeGazeClicker.prototype.update_input = function(slot, data) {
		switch (slot.index) {
			case 0: // camera
				this.camera = data
				break
			case 1: // scene
				this.scene = data
				break
			default:
				break
		}
	}

	ThreeGazeClicker.prototype.update_output = function(slot) {
		if (slot.index === 0) {
			return this.scene
		}
		else if (slot.index === 1) {
			return E2.app.player.rayInput.renderer.getSelectedMesh()
		}
	}

	ThreeGazeClicker.prototype.state_changed = function(ui) {
		if (ui)
			return

		this.rayInput = E2.app.player.rayInput
		this.object3d = this.rayInput.getMesh()
	}

	ThreeGazeClicker.prototype.update_state = function() {
		if (!this.scene || !this.camera) {
			return
		}

		this.rayInput.update(this.scene.children[0].children)

		if (this.scene.hasClickableObjects && this.showIcon !== false) {
			if (this.scene.children[1].children.indexOf(this.object3d) < 0) {
				this.scene.children[1].add(this.object3d)
			}
		}
		else {
			if (this.scene.children[1].children.indexOf(this.object3d) >= 0) {
				this.scene.children[1].remove(this.object3d)
			}
		}
	}

})()