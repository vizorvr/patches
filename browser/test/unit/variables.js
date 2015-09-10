var assert = require('assert')
var reset = require('./plugins/helpers').reset

global.E2 = {
	uid: function() {},
	dt: {
		ANY: { id: 8, name: 'Arbitrary' },
		FLOAT: { id: 0, name: 'Float' }
	},
	slot_type: {
		input: 0,
		output: 1
	}
}

global.msg = console.error

global.EventEmitter = require('../../scripts/event-emitter')
global.Variables = require('../../scripts/variables').Variables

describe('Variables', function() {
	var core, vars

	beforeEach(function() {
		core = reset()
		vars = new Variables(core)
		plugin = {
			variable_dt_changed: function() {}
		}
	})

	it('locks variables', function() {
		vars.lock('plugin', 'var1')
		assert.equal(vars.variables.var1.ref_count, 1)
		assert.equal(vars.variables.var1.users, 'plugin')
	})

	it('unlocks variables', function() {
		vars.lock('plugin', 'var1')
		vars.unlock('plugin', 'var1')
		assert.equal(vars.variables.var1, undefined)
	})

	it('sets dt and arrayness', function() {
		vars.lock(plugin, 'var1')
		vars.set_datatype('var1', 'dt', true)
		assert.equal(vars.variables.var1.dt, 'dt')
		assert.equal(vars.variables.var1.array, true)
	})

	it('clears dt and arrayness on d/c', function() {
		vars.lock(plugin, 'var1')
		vars.set_datatype('var1', 'dt', true)
		vars.connection_changed('var1', true)
		vars.connection_changed('var1', false)
		assert.equal(vars.variables.var1.dt, E2.dt.ANY)
	})

})



