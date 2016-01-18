var assert = require('assert')
require('./plugins/helpers')

var BlendFunctions = require('../../scripts/blendFunctions')

describe('Blend Functions', function() {
	var bfs

	var ids = [
		'linear-blend',
		'inverse-blend',
		'circular-blend',
		'cubic-blend',
		'exponential-blend',
		'quadratic-blend',
		'quartic-blend',
		'quintic-blend',
		'sinusoidal-blend',
		'smoothstep-blend',
		'smootherstep-blend']

	beforeEach(function() {
		bfs = new BlendFunctions()
	})

	it('Preserves blend function ids', function() {
		for (var i = 0; i < ids.length; ++i) {
			assert.ok(bfs.getById(ids[i]) !== undefined, ids[i])
		}
	})

	it('Has tests for all blend functions', function() {
		var allFuncs = bfs.functions

		for (var i = 0; i < allFuncs.length; ++i) {
			assert.ok(ids.indexOf(allFuncs[i].id) !== -1, allFuncs[i].id)
		}
	})

	it('Stays within [0..1] range', function() {
		for (var i = 0; i < ids.length; ++i) {
			var func = bfs.getById(ids[i])

			var iterations = 10
			for (var f = 0; f < iterations; f++ ) {
				var result = func.func(f / iterations)
				assert.ok(result >= 0 && result <= 1, func.id + ' ' + f / iterations + ' -> ' + result.toString())
			}
		}
	})
})
