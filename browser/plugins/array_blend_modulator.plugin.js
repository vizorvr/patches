(function() {
	var ArrayBlend = E2.plugins.array_blend_modulator = function ArrayBlend(core, node)
	{
		Plugin.apply(this, arguments)

		var that = this

		this.desc = 'Set up n inputs, then choose which one to output. The output will animate from the previous input to the currently selected one over time duration and using the selected blending function';

		this.input_slots = [{
			name: 'number', dt: E2.dt.FLOAT, def: 0,
			desc: 'Input number to select for output.'
		}, {
			name: 'duration', dt: E2.dt.FLOAT, def: 1,
			desc: 'Duration of blend animation'
		}]

		this.output_slots = [
			{ name: 'value', dt: E2.dt.ANY, desc: 'Emits the selected input.' },
			{ name: 'length', dt: E2.dt.FLOAT, desc: 'Emits the number of inputs = the length of the array.' }
		]

		this.core = core
		this.node = node
		this.lsg = new AutoSlotGroup(core, node, [], [])
		this.lsg.set_dt(core.datatypes.FLOAT)

		this.node.on('slotAdded', function() {
			that.dynInputs = node.getDynamicInputSlots()
			that.updated = true
		})

		this.node.on('slotRemoved', function() {
			that.dynInputs = node.getDynamicInputSlots()
			that.updated = true
		})

		this.blendFunctions = new BlendFunctions()

		this.state = {
			blendFuncId: this.blendFunctions.getByIndex(0).id
		}

		this.values = []
	}

	ArrayBlend.prototype = Object.create(Plugin.prototype)

	ArrayBlend.prototype.create_ui = function() {
		var $ui = make('div')

		this.blendFunctions.createUi($ui, function(newBlendFunc, newSelection) {
			that.undoableSetState('blendFuncId', newSelection, that.state.blendFuncId)

			// cache so that don't need to re-search again
			that.blendFunc = newBlendFunc
		})

		return $ui
	}

	ArrayBlend.prototype.reset = function() {
		this.triggered = false
		this.oneShot = false
		this.duration = 1
		this.startTime = 0
		this.startValue = 0
		this.endValue = 1
		this.value = 0

		this.blendFunc = this.blendFunctions.getById(this.state.blendFuncId)

		Plugin.prototype.reset.apply(this, arguments)
	}

	ArrayBlend.prototype.update_input = function(slot, data) {
		if (slot.dynamic) {
			this.values[slot.index] = data
		}
		else {
			if (slot.name === 'number') {
				this.nextTargetValue = Math.min(Math.max(0, data), this.values.length - 1)
			}
			else if (slot.name === 'duration') {
				this.duration = data
			}

			Plugin.prototype.update_input.apply(this, arguments)
		}
	}

	ArrayBlend.prototype.connection_changed = function(on, conn, slot) {
		if (slot.dynamic && !on) {
			delete this.values[slot.index]
		}
	}

	ArrayBlend.prototype.update_output = function(slot) {
		if (slot.name === 'value') {
			return this.value
		}
		else if (slot.name === 'length') {
			return this.dynInputs.length
		}
	}

	ArrayBlend.prototype.update_state = function() {
		if (this.nextTargetValue !== undefined && this.values[this.nextTargetValue] !== this.endValue) {
			this.startTime = this.core.abs_t
			this.startValue = this.value
			this.endValue = this.values[this.nextTargetValue]
			this.triggered = true
		}

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

	ArrayBlend.prototype.state_changed = function(ui) {
		if (ui) {
			this.blendFunctions.initialise(ui, this.state.blendFuncId)
		}

		this.dynInputs = this.node.getDynamicInputSlots()

		if (!this.dynInputs.length) {
			this.node.add_slot(E2.slot_type.input, {
				name: '0',
				dt: E2.dt.FLOAT,
				array: false
			})

			this.dynInputs = this.node.getDynamicInputSlots()
		}

		this.lsg.infer_dt()
	}
})()
