module.exports = function createVizorSandbox() {
	var sandbox = {
		navigator: {
			userAgent: 'node'
		},
		Vizor: {
		},
		document: {
			createElement: function() {
				return {
					addEventListener: function() {}
				}
			},
			getElementsByTagName: function() {
				return [{
					appendChild: function() {}
				}]
			}
		},
		$: function() {
			return [ {
				getContext: function() {}
			} ]
		},
		VizorWebVRAdapter: function() {
			this.getEyeParameters = function() {
				return { fieldOfView: {}}
			}
		},
		WebVRConfig: {},
		addEventListener: function() {},
		setTimeout: function() {},
		console: console,
		require: function() {
			return {
				cancelTimer: function() {}
			}
		},
		module: undefined,
		exports: undefined,
		define: undefined,
		msg: function() {},
		screen: {
			width: 1024,
			height: 1024
		}
	}
	
	sandbox.window = sandbox
	sandbox.self = sandbox

	return sandbox
}
