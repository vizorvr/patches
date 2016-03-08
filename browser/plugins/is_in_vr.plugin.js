(function() {
	var IsInVRPlugin = E2.plugins.is_in_vr = function(core, node) {
		Plugin.apply(this, arguments)

		this.desc = 'Outputs true if the graph is currently viewed in VR'

		this.input_slots = []

		this.output_slots = [{
				name: 'fullscreen',
				dt: E2.dt.BOOL,
				desc: 'true if in fullscreen, false if not'
			},
			{
				name: 'stereo',
				dt: E2.dt.BOOL,
				desc: 'true if in stereo, false if not'
			}]

		this.outputs = {}
	}

	IsInVRPlugin.prototype = Object.create(Plugin.prototype)

	IsInVRPlugin.prototype.update_state = function() {
		var isFullscreen = E2.util.isFullscreen()
		var isStereo = E2.core.webVRManager.isVRMode()

		this.outputs.fullscreen = isFullscreen
		this.outputs.stereo = isStereo
	}

	IsInVRPlugin.prototype.update_output = function(slot) {
		return this.outputs[slot.name]
	}

	IsInVRPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			function refreshCallback(e) {
				// from webvr-manager:
				var Modes = {
					UNKNOWN: 0,
					// Not fullscreen, just tracking.
					NORMAL: 1,
					// Magic window immersive mode.
					MAGIC_WINDOW: 2,
					// Full screen split screen VR mode.
					VR: 3,
				};

				this.outputs.stereo = e.detail.mode === Modes.VR
				this.outputs.fullscreen = e.detail.mode !== Modes.NORMAL

				this.updated = true
			}

			this.modeChangeListener = refreshCallback.bind(this)

			document.body.addEventListener('vrManagerModeChanged',
				this.modeChangeListener);
		}
	}

	IsInVRPlugin.prototype.destroy = function() {
		document.body.removeEventListener('vrManagerModeChanged',
			this.modeChangeListener)
	}

})()
