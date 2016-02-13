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

var UIDragAwareHelper = function(domNode, onStart) {

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
		return {
			touchId 		: data.touchId,
			pointer			: data.pointer,
			position 		: {x: currentPosition.x, y: currentPosition.y},
			lastPosition 	: {x: lp.x, y: lp.y},
			startPosition	: {x: op.x, y: op.y},
			startOffset		: {x: o.x, y: o.y},
			delta			: {x : (currentPosition.x - lp.x), y : (currentPosition.y - lp.y) },
			startDelta		: {x : (currentPosition.x - op.x), y : (currentPosition.y - op.y) }
		}
	}

	var _attached = false	// prevent up() from executing more than once
	var up = function(data) { return function(e) {
		if (!_attached) return
		if (E2 && E2.ui) E2.ui.setDragging(false);
		domNode.removeEventListener(that.dragEvents.remove, 	data.up)
		document.removeEventListener('mousemove', 	data.move, true)
		document.removeEventListener('touchmove', 	data.move, true)
		document.removeEventListener('mouseup', 	data.up)
		document.removeEventListener('touchcancel', data.up)
		document.removeEventListener('touchend', 	data.up)
		_attached = false
		if (e.preventDefault) e.preventDefault()
		_emit(domNode, that.dragEvents.end, makeEventData(data, {x: data.lastPosition.x, y: data.lastPosition.y}))
		return true
	}}

	var move = function(data) {
		return function(e) {
			var t = e.touches ? e.touches[data.touchId] : e;

			var ed = makeEventData(data, {x: t.pageX, y : t.pageY})

			if (Math.abs(ed.delta.x) + Math.abs(ed.delta.y)  >= that.minDelta) {
				_emit(domNode, that.dragEvents.move, ed)
				data.lastPosition = ed.position
			}
			if(e.preventDefault) e.preventDefault()
			return true
		} // end closure
	}

	var down = function() {
		return function(e) {

			var touchId = 0		// @todo get correct touch id
			var t = (e.touches) ? e.touches[touchId] : e;

			var data = {
				touchId 		: touchId,
				pointer			: t,
				lastPosition	: {	x: t.pageX,	y: t.pageY },
				startPosition	: { x: t.pageX,  y: t.pageY	},
				startOffset		: { x: t.offsetX,	y: t.offsetY }
			}

			if (!onStart(makeEventData(data, {x: t.pageX, y: t.pageY}))) return true

			data.up = up(data)
			data.move = move(data)
			document.addEventListener('touchend', data.up)
			document.addEventListener('touchcancel', data.up)
			document.addEventListener('mouseup', data.up)
			document.addEventListener('touchmove', data.move, true)
			document.addEventListener('mousemove', data.move, true)
			domNode.addEventListener(that.dragEvents.remove, data.up)
			_attached = true
			if(e.preventDefault) e.preventDefault()

			if (E2 && E2.ui) E2.ui.setDragging(true);

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