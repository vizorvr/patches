global.E2 = {}
var Application = require('../../scripts/application')

var assert = require('assert')

var f = Application.prototype.determineWebSocketEndpoint.bind({}, '/ep')

describe('Determine WS connection options', function() {

	beforeEach(function() {
		global.Vizor = {
			releaseMode: false
		}
		global.window = {
			location: {
				hostname: 'foo.vizor.test',
				port: 8000,
			}
		}
	})

	it('uses unsecure by default', function() {
		assert.equal('ws://foo.vizor.test:8000/ep', f())
	})

	it('uses secureWebSocket override', function() {
		global.Vizor.useSecureWebSocket = true
		assert.equal('wss://foo.vizor.test:443/ep', f())
	})

	it('uses webSocketHost and secureWebSocket overrides', function() {
		global.Vizor.useSecureWebSocket = true
		global.Vizor.webSocketHost = 'ws.ooh.vizor.test'
		assert.equal('wss://ws.ooh.vizor.test:443/ep', f())
	})

	it('uses webSocketHost override', function() {
		global.Vizor.webSocketHost = 'ws.ooh.vizor.test'
		assert.equal('ws://ws.ooh.vizor.test:8000/ep', f())
	})

})