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
			assert.equal(data.desc, "<p>Emit <strong>True</strong> if <em>and only if</em> both inputs are <strong>True</strong>. <strong>False</strong> otherwise.</p>\n")
			assert.deepEqual(data.inputs, [{name: 'a', desc: '<p>The first <strong>operand</strong>.</p>\n'}, {name: 'b', desc: '<p>The second <strong>operand</strong>.</p>\n'}])
			assert.deepEqual(data.outputs, [{name: 'bool', desc: '<p>Emits <strong>True</strong> if <strong>first</strong> <em>and</em> <strong>second</strong> are <strong>True</strong>, and <strong>False</strong> otherwise.</p>\n'}])

			done()
		}

		dc.getPluginDocumentation(req, res, function() {assert.ok(false); done()})
	})

	it('fetches 404 for plugin without documentation', function(done) {
		var req = {params: {}}
		var res = {}
		req.params.pluginName = 'nonexistent_test_plugin'

		res.json = function(data) {
			assert.ok(false, 'found an nonexistent plugin documentation')

			done()
		}

		dc.getPluginDocumentation(req, res, function(e) {assert.ok(e.status === 404); done()})
	})
})
