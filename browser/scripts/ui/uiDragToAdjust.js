// moved without changes from NodeUI.makeUIAdjustableValue

// makes an element adjustable by dragging in two directions
// onChange callback is (value, screenDelta)
// note, does not support css/dom rotation of surface element
// can be bound twice for XY controls
var uiMakeDragToAdjust = function(domNode, onStart, onChange, onEnd, options) {

	var o = _.extend({
		min : 0.0,
		max : 1.0,
		step : 0.1,
		size : 100,	// size of full range of control (e.g. min to max in 100px)
		getValue : null,	// supply function to dynamically read this value from elsewhere (e.g. state)
		value : 0.5,	// default if no getValue()

		allowTextInput : true,
		parseTextInput : null,
		textInputParentNode : null,	// which node to attach the dynamic input control to

		orientation: 'vertical',
		isSurface : false,			// use the domNode as a surface, scaling value along the node's width or height
		surfaceDomNode : null,		// use another domNode's dimensions as surface, instead of this one (it won't move the node!)
		cssCursor: 'ns-resize'		// e.g. ns-resize, we-resize, crosshair, all-scroll, etc
	}, options)

	if (parseFloat(o.step) === 0.0) {
		err("step cannot be zero")
		return
	}

	var isVertical = (o.orientation === 'vertical')
	var getValue = (typeof o.getValue === 'function') ? o.getValue : function(){return parseFloat(o.value)}
	if (o.isSurface) o.allowTextInput = false	// not supported
	if (!o.textInputParentNode) o.allowTextInput = false

	onEnd = onEnd || function(){}

	var value = getValue()

	// helpers
	var clamp = THREE.Math.clamp
	var mapLinear = THREE.Math.mapLinear

	var parseInputValue = (typeof o.parseTextInput === 'function') ? o.parseTextInput : function(inputValue) {
		var v = parseFloat(inputValue)
		if (isNaN(v)) return false
		if (!isFinite(v)) return false
		return clamp(v, o.min, o.max)
	}

	var numSteps = (o.max - o.min) / o.step

	// down() will set these
	var minPixels = 1,
		normValue = o.max / value

	var isShiftPressed = function() {
		return E2.ui.flags.pressedShift;
	}

	var up = function(data) { return function(e) {
		E2.ui.setDragging(false);
		document.removeEventListener('mousemove', data.move, true)
		document.removeEventListener('touchmove', data.move, true)
		document.removeEventListener('mouseup', data.up)
		document.removeEventListener('touchcancel', data.up)
		document.removeEventListener('touchend', data.up)
		if(e.preventDefault) e.preventDefault()
		onEnd(value)
		document.body.style.cursor = '';
		var rectRef = o.surfaceDomNode || domNode
			rectRef.classList.remove('adjusting')
		return true
	}}

	var move = function(data) {
		return function(e) {
			var t = (e.touches) ? e.touches[data.touchId] : e;

			var pos
			if (data.rect) { // constrain xy within rect
				if (isVertical) {
					pos = t.pageY - data.rect.top
					clamp(pos, 0.0, 0.0 + data.rect.height);
				} else {
					pos = t.pageX - data.rect.left
					clamp(pos, 0.0, 0.0 + data.rect.width);
				}
			}
			else
				pos = (isVertical) ? t.pageY : t.pageX

			var delta = pos - data.last_pos

			var shiftPressed = isShiftPressed(), quantize = o.step
			if (Math.abs(delta) >= minPixels) {
				data.last_pos = pos
				if (shiftPressed) {
					delta /= 10.0;
					quantize = o.step / 10
				} else {
					quantize = o.step
					if ((delta > 15) || (delta < -15)) {	// above a threshold we decrease resolution
						delta *= 5
					}
				}

				var oldValue = value;

				if (!data.rect) {
					// single point
					normValue += (isVertical) ? (- delta) : delta;
				} else {
					// surface, cast to float
					normValue = 0.0 + pos
				}

				normValue = clamp(normValue, 0.0, o.size);
				value = mapLinear(normValue, 0.0, o.size, o.min, o.max);
				value = quantize * Math.round(value / quantize)

				if ((value !== oldValue)) {
					onChange(value, delta)
				}
			}

			if(e.preventDefault) e.preventDefault()
			return true
		} // end closure
	}

	var down = function() {
		return function(e) {
			var t = (e.touches) ? e.touches[0] : e;

			value = getValue()

			var data = {
				last_pos: (isVertical) ? t.pageY : t.pageX,
				touchId : 0
			}

			if (o.isSurface) {	// size ourselves as per element in question
				var rectRef = o.surfaceDomNode || domNode
				data.rect = rectRef.getBoundingClientRect()
				o.size =  (isVertical) ? data.rect.height : data.rect.width
				data.last_pos -= (isVertical) ? data.rect.top : data.rect.left
			}

			minPixels = o.size / numSteps

			normValue = mapLinear(value, o.min, o.max, 0, o.size)

			data.up = up(data)
			data.move = move(data)
			document.addEventListener('touchend', data.up)
			document.addEventListener('touchcancel', data.up)
			document.addEventListener('mouseup', data.up)
			document.addEventListener('touchmove', data.move, true)
			document.addEventListener('mousemove', data.move, true)

			if(document.activeElement)
				document.activeElement.blur();

			if(e.preventDefault) e.preventDefault()

			onStart(value)
			E2.ui.setDragging(true);
			document.body.style.cursor = o.cssCursor;

			var rectRef = o.surfaceDomNode || domNode
			rectRef.classList.add('adjusting')
			data.move(e)
			return true
		}
	}

	function evChange(v) {
		var oldValue = value
		v = parseInputValue(v)
		if (v === false) v = oldValue
		v = clamp(v, o.min, o.max)
		if (oldValue !== v) {
			value = v
			normValue = mapLinear(value, o.min, o.max, 0, o.size)
			onStart(oldValue)
			onChange(value, oldValue)
			onEnd(value)
		}
	}

	if (o.allowTextInput) {
		domNode.addEventListener('dblclick', function(e){
			e.preventDefault();
			e.stopPropagation();
			NodeUI.enterValueControl(domNode, o.textInputParentNode, evChange)
			return false
		}, true);
	}


	domNode.addEventListener('touchstart', down())
	domNode.addEventListener('mousedown', down())
	domNode.addEventListener('mouseenter', function(){
		domNode.style.cursor = o.cssCursor;
	})
	domNode.addEventListener('mouseleave', function() {
		domNode.style.cursor = '';
	})
	if (domNode.className && (domNode.className.indexOf('uiValueAdjustable') === -1))
		domNode.className += ' uiValueAdjustable'
	else
		domNode.className = 'uiValueAdjustable'

}