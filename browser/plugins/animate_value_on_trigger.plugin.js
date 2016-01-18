(function() {
	var AnimateValueOnTrigger = E2.plugins.animate_value_on_trigger = function(core, node) {
		Plugin.apply(this, arguments)

		this.desc = 'Animate value from startValue to endValue on trigger over time specified by duration'

		this.core = core

		this.input_slots = [{
			name: 'trigger', dt: E2.dt.BOOL, def: false,
			desc: 'sending a boolean impulse to trigger will start the animation'
		}, {
			name: 'reset', dt: E2.dt.BOOL, def: false,
			desc: 'reset value back to start'
		}, {
			name: 'one-shot', dt: E2.dt.BOOL, def: false,
			desc: 'if true, only allow the animation to be triggered once (until reset)'
		}, {
			name: 'duration', dt: E2.dt.FLOAT, def: 1,
			desc: 'animation duration'
		}, {
			name: 'startValue', dt: E2.dt.FLOAT, def: 0,
			desc: 'animation start value'
		}, {
			name: 'endValue', dt: E2.dt.FLOAT, def: 1,
			desc: 'animation end value'
		}]

		this.output_slots = [{
			name: 'value', dt: E2.dt.FLOAT,
			desc: 'animated value'
		}, {
			name: 'active', dt: E2.dt.BOOL,
			desc: 'true while the animation is active'
		}]

		this.blendFunctions = new BlendFunctions()

		this.state = {
			blendFuncId: this.blendFunctions.getByIndex(0).id
		}
	}

	AnimateValueOnTrigger.prototype = Object.create(Plugin.prototype)

	AnimateValueOnTrigger.prototype.create_ui = function() {
		var $ui = make('div')

		var that = this
		this.blendFunctions.createUi($ui, function(newBlendFunc, newSelection) {
			that.undoableSetState('blendFuncId', newSelection, that.state.blendFuncId)

			// cache so that don't need to re-search again
			that.blendFunc = newBlendFunc
		})

		return $ui
	}

	AnimateValueOnTrigger.prototype.reset = function() {
		this.triggered = false
		this.oneShot = false
		this.duration = 1
		this.startTime = 0
		this.startValue = 0
		this.endValue = 1

		this.blendFunc = this.blendFunctions.getById(this.state.blendFuncId)
	}

	AnimateValueOnTrigger.prototype.update_input = function(slot, data) {
		if (slot.name === 'trigger' && data && (!this.oneShot || !this.triggered)) {
			this.triggered = true
			this.startTime = this.core.abs_t
		}
		else if (slot.name === 'reset' && data) {
			this.triggered = false
		}
		else if (slot.name === 'one-shot') {
			this.oneShot = data
		}
		else if (slot.name === 'duration') {
			this.duration = data
		}
		else if (slot.name === 'startValue') {
			this.startValue = data
		}
		else if (slot.name === 'endValue') {
			this.endValue = data
		}
	}

	AnimateValueOnTrigger.prototype.update_output = function(slot) {
		if (slot.name === 'value') {
			return this.value
		}
		else if (slot.name === 'active') {
			return (this.triggered && this.value < this.endValue)
		}
	}

	AnimateValueOnTrigger.prototype.update_state = function() {
		if (!this.triggered) {
			this.value = this.startValue + (this.endValue - this.startValue) * this.blendFunc.func(0)
			this.always_update = false
		}
		else {
			var t = this.core.abs_t - this.startTime
			if (t <= this.duration && this.duration > 0) {
				this.value = this.startValue + (this.endValue - this.startValue) * this.blendFunc.func(t / this.duration)
				this.updated = true
				this.always_update = true
			}
			else {
				if (this.value !== this.endValue) {
					this.value = this.startValue + (this.endValue - this.startValue) * this.blendFunc.func(1)
					this.updated = true
					this.always_update = false
				}
			}
		}
	}

	AnimateValueOnTrigger.prototype.state_changed = function(ui) {
		if (ui) {
			this.blendFunctions.initialise(ui, this.state.blendFuncId)
		}
	}

})()
