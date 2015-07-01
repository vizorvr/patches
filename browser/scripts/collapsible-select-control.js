function CollapsibleSelectControl(handlebars) {
	this._handlebars = handlebars || Handlebars
	this._cb = function() {}

	this._resultTpl = this._handlebars
}

CollapsibleSelectControl.prototype.template = function(template) {
	this._template = template

	this._resultTpl = E2.views.presets.results;

	return this
}

CollapsibleSelectControl.prototype.data = function(d) {
	this._data = {}
	this._items = d

	d.map(function(item) {
		if (!this._data[item.category])
			this._data[item.category] = {}
		this._data[item.category][item.title] = item
	}.bind(this))

	return this
}

CollapsibleSelectControl.prototype.onOpen = function(cb) {
	this._cb = cb
	return this
}

CollapsibleSelectControl.prototype.focus = function() {
	$('input', this._el).focus()
}

CollapsibleSelectControl.prototype._reset = function() {
	$('.panel', this._el).show()
	$('table.result', this._el).empty().remove()
	$('.preset-result', this._el).empty()
}

CollapsibleSelectControl.prototype._search = function(text) {
	var that = this

	if (!text) {
		this._reset()
		return
	}

	$('.panel', this._el).hide()

	var $pr = $('.preset-result', this._el)

	var data = this._filterData(text)

	var $result = this._resultTpl(data)
	$pr.empty().html($result)

	var $lis = $('td', $pr)

	$lis.dblclick(function(e) {
		that._cb($(e.target).data('path'))
	})

	this._resultEls = $lis

	if (this._resultEls.length)
		$(this._resultEls.get(0)).addClass('active')

	this._selectedIndex = 0

}

CollapsibleSelectControl.prototype._filterData = function(text) {
	var that = this
	return this._items.reduce(function(items, item) {
		var score = that.scoreResult(text, item.title)

		if (score < text.length)
			return items;

		items.push({
			score: score,
			title: item.title,
			category: item.category,
			path: item.path
		})

		return items;
	}, [])
	.sort(function(a,b) {
		var dif = b.score - a.score;
		if (dif === 0) {
			if (a.title < b.title)
				return -1
			if (a.title > b.title)
				return 1
		}
		return dif
	})

}

CollapsibleSelectControl.prototype.scoreResult = function(oq, resultStr) {
	var lstr = resultStr.toLowerCase()//.replace(/\//gim, '')
	var scr = 0

	if (lstr.indexOf(oq) > -1)
		return 500

	var qs = oq.split(' ')

	function countInString(cc, str) {
		var count = 0
		var pos = str.indexOf(cc)
		while (pos !== -1) {
			count ++
			pos = str.indexOf(cc, pos + 1)
		}
		return count
	}

	for(var j=0; j < qs.length; j++) {
		var q = qs[j]

		for(var i=0; i < q.length; i++) {
			var sofar = q.substring(0, q.length-i)

			if (lstr.indexOf(sofar) > -1)
				scr += 2 * q.length - i

			var qInStr = countInString(q[i], lstr)
			if (qInStr < countInString(q[i], q)) {
				return 0
			}

			scr += qInStr
		}
	}

	return scr
}

CollapsibleSelectControl.prototype.render = function(el) {
	var that = this

	el.empty()

	el = el || $('<div class="collapsible-select-control">') .appendTo('body')

	this._el = el

	el.html(this._template({
		controlId: "col-sel-"+Date.now(),
		categories: this._data
	}))

	var $input = $('input', el)

	el.on('hide.bs.collapse', function(e) {
		$('.glyphicon', $(e.target).prev())
			.removeClass('glyphicon-chevron-down')
			.addClass('glyphicon-chevron-right')
	})

	el.on('show.bs.collapse', function(e) {
		$('.glyphicon', $(e.target).prev())
			.addClass('glyphicon-chevron-down')
			.removeClass('glyphicon-chevron-right')
	})

	$('li', el).dblclick(function(e) {
		that._cb($(e.target).data('path'))
		$(window).unbind('mousemove')
	})

	var dragging = false
	var mouseMoveBound = false
	var mouseDown = false
	var mouseX = 0
	var mouseY = 0
	var scrollInterval
	var scrollBound = false

	// Drag and drop an element from the list
	$('li', el).mousedown(function(e) {

		dragging = true
		mouseDown = true

		var title = $(e.target).text()

		var dragPreview = $('<div class="plugin-drag-preview"><span style="display: none;">Drop to create:</span>'+title+'</div>')
		var hoverArea = $('<div class="dragging-allowed"></div>');
		var dragPreviewInDom = false // only append the preview element when moving the mouse cursor while dragging

		var canvas = $('#canvases')
		var canvasWidth = canvas.width()
		var canvasHeight = canvas.height()
		var canvasX = canvas.position().left
		var canvasY = canvas.position().top
		var cp = E2.dom.canvas_parent;
		var scrollHoverAreaSize = 25; // Pixel size for hover area for scrolling around the canvas

		// Handle document scrolling
		var scrollHandler = function() {

			var dragPreviewWidth = dragPreview.outerWidth()
			var dragPreviewHeight = dragPreview.outerHeight()

			var co = cp.offset();

			if(mouseX - scrollHoverAreaSize < co.left) {
				cp.scrollLeft(cp.scrollLeft() - 20)
			}

			else if(mouseX + scrollHoverAreaSize > co.left + cp.width()) {
				cp.scrollLeft(cp.scrollLeft() + 20)
			}

			if(mouseY - scrollHoverAreaSize < co.top) {
				cp.scrollTop(cp.scrollTop() - 20)
			}

			else if(mouseY + scrollHoverAreaSize > co.top + cp.height()) {
				cp.scrollTop(cp.scrollTop() + 20)
			}

		}

		// Update the preview box position while moving the mouse
		function updatePreviewPosition(evt) {

			mouseX = evt.pageX
			mouseY = evt.pageY

			if(mouseX < (canvasWidth + canvasX) && mouseX > canvasX && mouseY < (canvasHeight + canvasY) && mouseY > canvasY) {
				dragPreview.css({ opacity: 1.0 }).find('span').show();
				hoverArea.addClass('dragging-on-top');

				// Only do scrolling after the user has dragged the object over the
				// canvas area once so it doesn't start scrolling while you're
				// holding the mouse button over the preset list.
				if(!scrollBound) {

					scrollBound = true

					scrollInterval = setInterval(function() {
						scrollHandler()
					}, 10);

				}

			}
			else {
				hoverArea.removeClass('dragging-on-top');
				dragPreview.css({ opacity: 0.5 }).find('span').hide();
			}

			dragPreview.css({ top: mouseY, left: mouseX })

		}

		// Add the preview box to the DOM when moving the mouse for the first time away from the box, while holding the mouse button down
		var mouseMoveHandler = function(evt) {

			if(!dragPreviewInDom) {

				$('.plugin-drag-preview').remove()

				dragPreview.appendTo('body')
				dragPreviewInDom = true

				$('#left-nav').addClass('dragging-not-allowed')
				$('.menu-bar').addClass('dragging-not-allowed')
				$('.resize-handle').addClass('dragging-not-allowed')

				hoverArea
					.appendTo('body')
					.width(canvas.width() - 6)
					.height(canvas.height() - 6)
					.css({ top: canvas.position().top, left: canvas.position().left })

				mouseMoveBound = true

			}

			updatePreviewPosition(evt)

		}

		// On mouseup unbind everything and destroy the preview box
		var mouseUpHandler = function(evt) {
			dragPreview.remove()
			hoverArea.remove()
			dragPreviewInDom = false
			$(document).unbind('mousemove', mouseMoveHandler)
			$(document).unbind('mouseup', mouseUpHandler)
			$(document).unbind('mousedown', scrollHandler)
			$('#left-nav').removeClass('dragging-not-allowed')
			$('.menu-bar').removeClass('dragging-not-allowed')
			$('.resize-handle').removeClass('dragging-not-allowed')

			// Only create new item when released over the canvas
			if(evt.pageX < (canvasWidth + canvasX) && evt.pageX > canvasX && evt.pageY < (canvasHeight + canvasY) && evt.pageY > canvasY) {
				that._cb($(e.target).data('path'))
			}

			mouseMoveBound = false
			mouseDown = false
			scrollBound = false
			clearInterval(scrollInterval)

		}

		if(!mouseMoveBound) {
			$(document).bind('mousemove', mouseMoveHandler)
			$(document).bind('mouseup', mouseUpHandler)
		}

	})

	var keyTimer
	$input.on('keyup', function(e) {
		if (keyTimer)
			clearTimeout(keyTimer)

		if (e.keyCode === 27) {
			e.stopPropagation()
			return $input.blur()
		}

		if (e.keyCode === 38 || e.keyCode === 40)
			return;

		keyTimer = setTimeout(that._search.bind(that, $input.val(), 100))
	})

	$input.on('keydown', function(e) {
		var res = that._resultEls
		var sel = that._selectedIndex
		var $sel

		var filterCodes = [13, 38, 40]

		if (filterCodes.indexOf(e.keyCode) < 0 || !res)
			return;

		if (res) {
			res.removeClass('active')
			$sel = $($(res)[that._selectedIndex])
		}

		switch(e.keyCode) {
			case 13: // ok
				if ($sel) {
					$sel.trigger('dblclick')
					$input.blur()
				}
				break;
			case 38: // up
				if (sel > 0)
					that._selectedIndex--
				break;
			case 40: // down
				that._selectedIndex++
				sel++
				break;
		}

		$sel = $($(res)[that._selectedIndex])
		$sel.addClass('active')
	})

	return this;
}

if (typeof(module) !== 'undefined')
	module.exports = CollapsibleSelectControl
