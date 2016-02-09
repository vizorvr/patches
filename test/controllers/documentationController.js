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
			assert.deepEqual(data.inputs, ['<p>first value\nFirst input value</p>\n', '<p>second value\nSecond input value</p>\n'])
			assert.deepEqual(data.outputs, ['<p>value\nThe sum of both input values</p>\n'])

			done()
		}

		dc.getPluginDocumentation(req, res)
	})
})
