(function()
	var StereoCubeMapPlugin = E2.plugins.stereo_cube_map = function (core, node) {
		Plugin.apply(this, arguments)

		this.desc = 'Stereo Cube Map'

		this.output_slots = [
			{
				name: 'texture',
				dt: core.datatypes.TEXTURE
			}
		]
	}

	StereoCubeMapPlugin.prototype = Object.create(Plugin.prototype)
	StereoCubeMapPlugin.prototype.reset = function() {

	}

	StereoCubeMapPlugin.prototype.update_output = function() {

	}
)