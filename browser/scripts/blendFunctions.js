// functions that map a value [0..1] to [0..1] over various curves
// id-strings should not be changed as this would break scripts
var BlendFunctions = function() {

	this.functions = [{
		id: 'linear-blend',
		name: 'Linear',
		func: function(d) {return d}
	}, {
		id: 'inverse-blend',
		name: 'Inverse',
		func: function(d) {return 1-d}
	}, {
		id: 'circular-blend',
		name: 'Circular',
		func: function(d) {return 1 - Math.sqrt(1 - d * d)}
	}, {
		id: 'cubic-blend',
		name: 'Cubic',
		func: function(d) {return d * d * d}
	}, {
		id: 'exponential-blend',
		name: 'Exponential',
		func: function(d) {return d === 0 ? 0 : Math.pow(1024, d - 1)}
	}, {
		id: 'quadratic-blend',
		name: 'Quadratic',
		func: function(d) {return d * d}
	}, {
		id: 'quartic-blend',
		name: 'Quartic',
		func: function(d) {return d * d * d * d}
	}, {
		id: 'quintic-blend',
		name: 'Quintic',
		func: function(d) {return d * d * d * d * d}
	}, {
		id: 'sinusoidal-blend',
		name: 'Sinusoidal',
		func: function(d) {return  1 - Math.cos(d * Math.PI / 2)}
	}, {
		// https://en.wikipedia.org/wiki/Smoothstep
		id: 'smoothstep-blend',
		name: 'Smoothstep',
		func: function(d) {return d * d * (3 - 2 * d)}
	}, {
		// Ken Perlin
		// http://www.amazon.com/Texturing-Modeling-Third-Procedural-Approach/dp/1558608486
		// https://en.wikipedia.org/wiki/Smoothstep
		id: 'smootherstep-blend',
		name: 'Smootherstep',
		func: function(d) {return d * d * d * (d * (d * 6 - 15) + 10)}
	}]

	this.getByIndex = function(idx) {
		return this.functions[idx]
	}

	this.getById = function(id) {
		for(var i = 0, len = this.functions.length; i < len; ++i) {
			if (this.functions[i].id === id) {
				return this.functions[i]
			}
		}
	}

	this.getIndex = function(blendFunc) {
		return this.functions.indexOf(blendFunc)
	}

	this.createUi = function($ui, callback) {
		var $selectBlendType = $('<select class="blend-type-sel" title="Select Blend Type"/>')

		for (var i = 0, len = this.functions.length; i < len; ++i) {
			var blendFunc = this.functions[i]
			$('<option>', {value: i, text: blendFunc.name}).appendTo($selectBlendType)
		}

		var that = this

		$selectBlendType.change(function() {
			var newBlendFunc = that.getByIndex($selectBlendType.val())
			var selection = newBlendFunc.id

			callback(newBlendFunc, selection)
		})

		$ui.append($selectBlendType)
	}

	this.initialise = function(ui, id) {
		var blendFunc = this.getById(id)
		var idx = this.getIndex(blendFunc)
		ui.find('.blend-type-sel').val(idx)
	}

}

if (typeof(module) !== 'undefined')
	module.exports = BlendFunctions
