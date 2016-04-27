/**
 * this helper allows any element to be dragged by mouse or touch and produce start/move/end events
 * var 	el = document.getElementById('test'),
 * 		d = new UIDragAware(el, function(){ return shouldStart(data) })
 * 		d.detach()		// remove your own event handlers if not removing element
 *
 * @emits uiDragstart|uiDragmove|uiDragend
 *
 * @param domNode
 * @param onStart optional callback test - if this returns false dragging is not enabled
 * @constructor
 */

var UIDragAwareHelper = function(domNode, onStart, trackX, trackY) {

	trackX = typeof trackX === 'undefined' ? true : !!trackX
	trackY = typeof trackY === 'undefined' ? true : !!trackY
	this.dragEvents = {
		start 	: 'uiDragstart',
		move	: 'uiDragmove',
		end		: 'uiDragend',
		remove	: 'uiDragremove'
	}

	onStart = onStart || function() { return true }

	var that = this
	this.minDelta = 2

	function _emit(node, eventName, data) {
		node.dispatchEvent(new CustomEvent(eventName, {detail: data}))
	}

	function makeEventData(data, currentPosition) {
		var op = data.startPosition, lp = data.lastPosition, o = data.startOffset
		var tx = trackX ? 1 : 0
		var ty = trackY ? 1 : 0

		var ret ={
			touchId 		: data.touchId,
			pointer			: data.pointer,
			position 		: {x: currentPosition.x, y: currentPosition.y},
			lastPosition 	: {x: lp.x, y: lp.y},
			startPosition	: {x: op.x, y: op.y},
			startOffset		: {x: o.x, y: o.y},
			delta			: {x : tx*(currentPosition.x - lp.x), y : ty*(currentPosition.y - lp.y) },
			startDelta		: {x : tx*(currentPosition.x - op.x), y : ty*(currentPosition.y - op.y) },
			dragThresholdPx	: data.dragThresholdPx,
			dragged			: data.dragged
		}
		if (!trackX) {
			ret.lastPosition.x = ret.position.x
			ret.startPosition.x = ret.position.x
		}
		if (!trackY) {
			ret.lastPosition.y = ret.position.y
			ret.startPosition.y = ret.position.y
		}

		return ret
	}

	var _attached = false	// prevent up() from executing more than once
	var minDelta = this.minDelta		// initial threshold

	var removeListeners = function(domNode, data) {
		domNode.removeEventListener(that.dragEvents.remove, 	data.up)
		domNode.removeEventListener('dragover', 	data.canceldrag, true)
		document.removeEventListener('click', 	data.up, true)
		document.removeEventListener('mousemove', 	data.move, true)
		document.removeEventListener('touchmove', 	data.move, true)
		document.removeEventListener('mouseup', 	data.up, true)
		document.removeEventListener('touchcancel', data.up, true)
		document.removeEventListener('touchend', 	data.up, true)
		document.removeEventListener('dragstart', 	data.canceldrag, true)
		window.removeEventListener('blur', data.up, true)
	}
	var up = function(data) { return function(e) {
		if (!_attached) return

		if (siteUI)
			setTimeout(function(){
				siteUI.isDragging = false
			}, 300)

		removeListeners(domNode, data)
		_attached = false

		if (data.dragged) {
			e.preventDefault()
			e.stopPropagation()
			setTimeout(function() {
				domNode.style.pointerEvents = data.pointerEvents
			}, 200)
		} else {
			domNode.style.pointerEvents = data.pointerEvents
		}

		_emit(domNode, that.dragEvents.end, makeEventData(data, {x: data.lastPosition.x, y: data.lastPosition.y}))

		// else
		return !data.dragged
	}}

	var move = function(data) {
		return function(e) {

			// occasionally the browser will throw us
			if (!_attached) {
				removeListeners(domNode, data)
				return true
			}

			var t = e.touches ? e.touches[data.touchId] : e

			var ed = makeEventData(data, {x: t.pageX, y : t.pageY})

			var xy = Math.abs(ed.delta.x) + Math.abs(ed.delta.y)
			
			if (xy >= minDelta) {
				if (minDelta > 0) {
					if (siteUI)
						siteUI.isDragging = true
					data.dragged 	= true
					minDelta = 0
					domNode.style.pointerEvents = 'none'
				}
				data.lastPosition = ed.position

				_emit(domNode, that.dragEvents.move, ed)

				if (e.preventDefault)
					e.preventDefault()
				if (e.stopPropagation)
					e.stopPropagation()
			}

			return true
		} // end closure
	}

	var down = function() {
		return function(e) {
			if (e.touches && e.touches.length>1)
				return true

			var touchId = 0		// @todo get correct touch id
			var t = (e.touches) ? e.touches[touchId] : e;

			var data = {
				touchId 		: touchId,
				pointer			: t,
				lastPosition	: {	x: t.pageX,	y: t.pageY },
				startPosition	: { x: t.pageX,  y: t.pageY	},
				startOffset		: { x: t.offsetX,	y: t.offsetY },
				dragThresholdPx	: that.minDelta,
				dragged			: false,
				canceldrag : function(e){e.preventDefault(); e.stopPropagation(); return false;},
				pointerEvents	: window.getComputedStyle(domNode).pointerEvents
			}

			if (!onStart(makeEventData(data, {x: t.pageX, y: t.pageY}),e)) return true

			minDelta = that.minDelta
			data.up = up(data)
			data.move = move(data)
			window.addEventListener('blur', data.up, true)
			document.addEventListener('dragstart', 	data.canceldrag, true)
			document.addEventListener('touchend', data.up, true)
			document.addEventListener('touchcancel', data.up, true)
			document.addEventListener('mouseup', data.up, true)
			document.addEventListener('touchmove', data.move, true)
			document.addEventListener('mousemove', data.move, true)
			document.addEventListener('click', 	data.up, true)
			domNode.addEventListener('dragover', 	data.canceldrag, true)
			domNode.addEventListener(that.dragEvents.remove, data.up)
			_attached = true

			// if (e.preventDefault)
			// 	e.preventDefault()

			_emit(domNode, that.dragEvents.start, data)

			data.move(e)
			return true
		}
	}

	var _down = down()

	this.attach = function() {
		domNode.addEventListener('touchstart', _down)
		domNode.addEventListener('mousedown', _down)
	}

	this.detach = function() {
		domNode.dispatchEvent(new CustomEvent(that.dragEvents.remove)) // force detach handlers
		domNode.removeEventListener('mousedown', _down)
		domNode.removeEventListener('touchstart', _down)
	}

	this.attach()
}