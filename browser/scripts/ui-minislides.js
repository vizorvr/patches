/**
 * @author gmarinov
 */
var Minislides = function(containerEl, opts) {

	this.detachQueue = []

	opts = _.extend({
		nextOn : 'a.slide-next',
		slideQuery: ':scope>section',
		slideContainerQuery: '.slides',
		transitionMethod: 'crossfade'		// crossfade|horizontal
	}, opts)

	opts.slideFunction = (opts.transitionMethod === 'crossfade') ? Minislides.crossfade : Minislides.horizontal

	this.container = containerEl
	var sc = this.container.querySelector(opts.slideContainerQuery)	// one element

	var containerClass = containerEl.className
	var scClass = sc.className

	this.detachQueue.push(function(){
		sc.className = scClass
		sc.style.height = ""
		sc.style.width = ""
		sc.style.left = ""
		containerEl.className = containerClass
		containerEl.style.height = ""
		containerEl.style.width = ""
	})

	this.container.classList.add('minislides')
	sc.classList.add('slides')
	sc.classList.add(opts.transitionMethod)
	sc.style.userSelect = 'none'

	this.isCrossfade = opts.transitionMethod === 'crossfade'

	this.slideContainer = sc
	this.slides = sc.querySelectorAll(opts.slideQuery)
	this.slideSwitcher = document.createElement('DIV')
	this.selected = 0

	return this.init(opts)
}

// add an event listener and put it in the queue to destroy() later
Minislides.prototype._on = function(element, eventName, handler, phase) {
	phase = !!phase
	element.addEventListener(eventName, handler, phase)
	this.detachQueue.push(function(){
		element.removeEventListener(eventName, handler, phase)
	})
}

Minislides.prototype.attach = function(slideFn) {
	this._on(this.container, 'slideChange', slideFn.bind(this))
	this._on(this.container, 'slideChange', this.onSlideChanged.bind(this))
}


Minislides.prototype.detach = function() {
	if (this.detachQueue && this.detachQueue.length) {
		var removeHandler
		while (removeHandler = this.detachQueue.pop()) {
			removeHandler()
		}
	}
	if (this._dragHelper)
		this._dragHelper.detach()

	this.container.classList.remove('minislides')
	$('*', this.container).off('.minislides')

	if (this.slideSwitcher) {
		this.slideSwitcher.parentNode.removeChild(this.slideSwitcher)
		this.slideSwitcher = null
	}
}

Minislides.prototype.getSlideDimensions = function(el) {
	return el.getBoundingClientRect()
}

Minislides.horizontal = function(e) {
	var ix = e.detail.index
	var leftPx = -ix * this.slideWidth
	this.slideContainer.style.left = leftPx + 'px'
}

Minislides.crossfade = function(e){
	var ix = e.detail.index
	var slides = jQuery(this.slides)
	var selected = slides.eq(ix)
	selected.fadeIn(350)
	slides.not(selected).fadeOut(650)
}

Minislides.prototype.init = function(opts) {
	opts = opts || {}
	var that = this

	var sw = this.slideSwitcher
	sw.classList.add('slideSwitcher')
	this.container.appendChild(sw)

	Array.prototype.forEach.call(this.slides, function(el, ix) {
		el.classList.add('slide')
		el.classList.add('slide'+(ix+1))
		var step = document.createElement('button')
		step.className = 'slide-step'
		step.dataset.index = ix		// data-index="1"
		sw.appendChild(step)
		var listener = function(e){
			e.preventDefault()
			e.stopPropagation()
			that.showSlide(ix)
			return false
		}
		step.addEventListener('touchend', listener)
		step.addEventListener('click', listener)
	})

	this.attach(opts.slideFunction)
	console.log(this.selected)
	this.showSlide(this.selected)

	setTimeout(function(){
		var d = this.getSlideDimensions(this.slides[this.selected])
		this.slideWidth = d.width
		this.slideHeight = d.height
		var cs = this.container.style
		if (this.slideWidth) {
			cs.height = this.slideHeight + 'px'
			cs.width = this.slideWidth + 'px'
		}
		this.slideContainer.style.width = (this.slideWidth * this.slides.length) + 'px'
		this.slideContainer.style.height = this.slideHeight+'px'
	}.bind(this), 100)

	this.initDrag()

	jQuery(opts.nextOn, this.slides)
		.off('.minislides')
		.on('click.minislides touchend.minislides', function(e){
			if (siteUI && siteUI.isDragging)
				return true	// not for us

			e.preventDefault()
			e.stopPropagation()
			that.nextSlide()
			return false
		})

	return this
}

Minislides.prototype.initDrag = function() {
	var that = this
	var canDragLive = !this.isCrossfade

	var el = this.container
	var drag = new UIDragAwareHelper(el, undefined, true, false)
	drag.minDelta = 10

	var prev = this.prevSlide.bind(this)
	var next = this.nextSlide.bind(this)

	var leftPx = null

	var exec = function(e, cb) {
		e.preventDefault()
		e.stopPropagation()
		cb()
		canDragLive = false
		return false
	}

	this._on(el, drag.dragEvents.end, function(e){
		var dx = e.detail.startDelta.x

		if (!e.detail.dragged)
			return true

		that.slideContainer.classList.remove('dragging')

		leftPx = null

		if (Math.abs(dx) < that.slideWidth / 9)
			return exec(e, function(){that.showSlide(that.selected)})

		if (dx > 0)
			return exec(e, prev)
		if (dx < 0)
			return exec(e, next)

	})


	if (canDragLive) {

		var sc = that.slideContainer


		this._on(that.slideContainer, 'transitionend', function(){
			canDragLive = true
		})

		this._on(el, drag.dragEvents.move, function(e) {
			if (!e.detail.dragged)
				return true

			that.slideContainer.classList.add('dragging')

			var sw = that.slideWidth * that.slides.length
			var dx = e.detail.startDelta.x

			if (leftPx === null)
				leftPx = parseFloat(window.getComputedStyle(sc).left.replace("px", ''))

			var newLeft = leftPx + dx

			if (newLeft > 0)
				newLeft = 0
			
			if (newLeft - that.slideWidth < -sw)
				newLeft = -sw + that.slideWidth

			sc.style.left = newLeft + 'px'
			return true
		})
	}

	this._dragHelper = drag

}

Minislides.prototype.canWrap = function() {
	return false
}

Minislides.prototype.nextSlide = function() {
	var sel = this.selected + 1
	if (sel > this.slides.length - 1) {
		if (this.canWrap())
			sel = 0
		else
			sel = this.slides.length - 1
	}
	return this.showSlide(sel)
}

Minislides.prototype.prevSlide = function() {
	var sel = this.selected - 1
	if (sel < 0) {
		if (this.canWrap())
			sel = this.slides.length - 1
		else
			sel = 0
	}
	return this.showSlide(sel)
}

Minislides.prototype.onSlideChanged = function(e) {
	var that = this
	var steps = this.slideSwitcher.querySelectorAll('.slide-step')
	Array.prototype.forEach.call(steps, function(el, ix){
		el.classList.remove('selected')
		if (ix === that.selected)
			el.classList.add('selected')
	})
}

Minislides.prototype.showSlide = function(ix) {
	ix = ix % this.slides.length
	this.selected = ix
	var ev = new CustomEvent('slideChange', {detail: {index: ix, slide: this.slides[ix]}})
	this.container.dispatchEvent(ev)
	return this
}