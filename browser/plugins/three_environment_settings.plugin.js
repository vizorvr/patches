(function() {
	var ThreeEnvironmentSettingsPlugin = E2.plugins.three_environment_settings = function (core, node) {
		Plugin.apply(this, arguments)

		this.desc = 'Environment Settings Description'

		this.input_slots = [{
			name: 'fog color',
			dt: core.datatypes.COLOR,
			def: new THREE.Color(0xffffff)
		}, {
			name: 'fog near',
			dt: core.datatypes.FLOAT,
			def: 0.1
		}, {
			name: 'fog far',
			dt: core.datatypes.FLOAT,
			def: 1000.0
		}]

		this.output_slots = [{
			name: 'environment',
			dt: core.datatypes.ENVIRONMENTSETTINGS
		}]
	}

	ThreeEnvironmentSettingsPlugin.prototype = Object.create(Plugin.prototype)

	ThreeEnvironmentSettingsPlugin.prototype.reset = function() {
		this.envSettings = new E2.EnvironmentSettings()
	}

	ThreeEnvironmentSettingsPlugin.prototype.update_input = function(slot, data) {
		if (slot.name === 'fog color') {
			this.envSettings.fog.color = data
		}
		else if (slot.name === 'fog near') {
			this.envSettings.fog.near = data
		}
		else if (slot.name === 'fog far') {
			this.envSettings.fog.far = data
		}
	}

	ThreeEnvironmentSettingsPlugin.prototype.update_output = function() {
		return this.envSettings
	}
})()
