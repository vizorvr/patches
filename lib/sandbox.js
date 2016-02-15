module.exports = function createVizorSandbox() {
	var sandbox = {
		navigator: {
			userAgent: 'node'
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
		msg: function() {}
	}
	
	sandbox.window = sandbox
	sandbox.self = sandbox

	return sandbox
}
