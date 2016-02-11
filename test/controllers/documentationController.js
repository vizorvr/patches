var assert = require('assert');
var DocumentationController = require('../../controllers/documentationController');
var when = require('when');

describe('DocumentationController', function() {
	var dc

	beforeEach(function() {
		dc = new DocumentationController()
	})

	it('fetches documentation for plugins', function(done) {
		var req = {params: {}}
		var res = {}
		req.params.pluginName = 'and_modulator'

		res.json = function(data) {
			assert.equal(data.desc, "<p>Emit true if and only if both inputs are true and false otherwise.</p>\n")
			assert.deepEqual(data.inputs, [{name: 'a', desc: '<p>The first operand.</p>\n'}, {name: 'b', desc: '<p>The second operand.</p>\n'}])
			assert.deepEqual(data.outputs, [{name: 'bool', desc: '<p>Emits true if <strong>first</strong> <em>and</em> <strong>second</strong> are true, and false otherwise.</p>\n'}])

			done()
		}

		dc.getPluginDocumentation(req, res)
	})
})
