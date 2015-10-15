/**
 * Drag and drop an element from the side tab
 * @param  {Event} e         Mousedown event from bind
 */
function dragAndDropMouseDownHandler(e) {
	var uiState = E2.ui.state;
	var chatWindow = E2.dom.chatWindow;
	var chatVisible = uiState.visibility.panel_chat;
	var collapseChat = E2.ui.onChatToggleClicked.bind(E2.ui);
	var presetsLib = E2.dom.presetsLib;
	var presetsVisible = uiState.visibility.panel_presets;
	var collapsePresets = E2.ui.onPresetsToggleClicked.bind(E2.ui);
	var assetsLib = E2.dom.assetsLib;
	var assetsVisible = uiState.visibility.panel_assets;
	var collapseAssets = E2.ui.onAssetsToggleClicked.bind(E2.ui);
	
	var mouseMoveBound = false
	var mouseX = 0
	var mouseY = 0
	var scrollInterval
	var scrollBound = false

	var title = $(e.target).text()

	var dragPreview = $('<div class="plugin-drag-preview"><div class="drag-add-icon"><svg class='
					  + '"icon-drag-add"><use xlink:href="#icon-drag-add"></use></svg></div>'
					  + '<span style="display: none;">Drop to create:</span>'+title+'</div>')
	var hoverArea = $('<div class="dragging-allowed"></div>')
	var dragPreviewInDom = false // only append the preview element when moving the mouse cursor while dragging
	
	var canvas = $('#canvases')
	var canvasWidth = canvas.width()
	var canvasHeight = canvas.height()
	var canvasX = canvas.position().left
	var canvasY = canvas.position().top
	var cp = E2.dom.canvas_parent
	var scrollHoverAreaSize = 25 // Pixel size for hover area for scrolling around the canvas
	
	if (presetsVisible) {
		var plHeight = presetsLib.outerHeight(true);
		var plWidth = presetsLib.outerWidth(true);
		var plX = presetsLib.position().left;
		var plY = presetsLib.position().top;
	}
	if (assetsVisible) {
		var alHeight = assetsLib.outerHeight(true);
		var alWidth = assetsLib.outerWidth(true);
		var alX = assetsLib.position().left;
		var alY = assetsLib.position().top;
	}
	if (chatVisible) {
		var chHeight = chatWindow.outerHeight(true);
		var chWidth = chatWindow.outerWidth(true);
		var chX = chatWindow.position().left;
		var chY = chatWindow.position().top;
	}

	// Handle document scrolling
	var scrollHandler = function() {

		var dragPreviewWidth = dragPreview.outerWidth()
		var dragPreviewHeight = dragPreview.outerHeight()

		var co = cp.offset()

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
			dragPreview.css({ opacity: 1.0 }).find('span').show()
			hoverArea.addClass('dragging-on-top')

			// Only do scrolling after the user has dragged the object over the
			// canvas area once so it doesn't start scrolling while you're
			// initially holding the mouse button down over the preset list.
			if(!scrollBound) {

				scrollBound = true

				scrollInterval = setInterval(function() {
					scrollHandler()
				}, 10)

			}

		}
		else {
			hoverArea.removeClass('dragging-on-top')
			dragPreview.css({ opacity: 0.5 }).find('span').hide()
		}

		dragPreview.css({ top: mouseY - dragPreview.outerHeight(true) + 8, left: mouseX - (dragPreview.outerWidth(true) / 2) })

	}

	// Add the preview box to the DOM when moving the mouse for the first time away from the box, while holding the mouse button down
	var mouseMoveHandler = function(evt) {

		if(!dragPreviewInDom) {

			$('.plugin-drag-preview').remove()

			dragPreview.appendTo('body')
			dragPreviewInDom = true

			E2.dom.editorHeader.addClass('dragging-not-allowed');
			E2.dom.breadcrumb.addClass('dragging-not-allowed');
			E2.dom.assetsLib.addClass('dragging-not-allowed');
			E2.dom.presetsLib.addClass('dragging-not-allowed');
			E2.dom.chatWindow.addClass('dragging-not-allowed');
			E2.dom.bottomBar.addClass('dragging-not-allowed');

			hoverArea
				.appendTo('body')
				.width(canvas.width())
				.height(canvas.height())
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
		E2.dom.editorHeader.removeClass('dragging-not-allowed');
		E2.dom.breadcrumb.removeClass('dragging-not-allowed');
		E2.dom.assetsLib.removeClass('dragging-not-allowed');
		E2.dom.presetsLib.removeClass('dragging-not-allowed');
		E2.dom.chatWindow.removeClass('dragging-not-allowed');
		E2.dom.bottomBar.removeClass('dragging-not-allowed');

		mouseMoveBound = false
		scrollBound = false
		clearInterval(scrollInterval)
		
		// Only create new item when released over the canvas and hide floating box if dropped under it;
		if(evt.pageX < (canvasWidth + canvasX) && evt.pageX > canvasX && evt.pageY < (canvasHeight + canvasY) && evt.pageY > canvasY) {
			e.data.dropSuccessCb(e)
			
			if ((presetsVisible) && (evt.pageX < (plWidth + plX) && evt.pageX > plX && evt.pageY < (plHeight + plY) && evt.pageY > plY)) { 
				collapsePresets();
			}
			if ((assetsVisible) && (evt.pageX < (alWidth + alX) && evt.pageX > alX && evt.pageY < (alHeight + alY) && evt.pageY > alY)) { 
				collapseAssets();
			}
			if ((chatVisible) && (evt.pageX < (chWidth + chX) && evt.pageX > chX && evt.pageY < (chHeight + chY) && evt.pageY > chY)) { 
				collapseChat();
			}
		}

	}

	// Take care to only bind mouse movement and mouseup once
	if(!mouseMoveBound) {
		$(document).bind('mousemove', mouseMoveHandler)
		$(document).bind('mouseup', mouseUpHandler)
	}

}

function CollapsibleSelectControl(handlebars) {
	this._handlebars = handlebars || Handlebars
	this._cb = function() {}

	this._resultTpl = this._handlebars
}

CollapsibleSelectControl.prototype.template = function(template) {
	this._template = template

	this._resultTpl = E2.views.presets.results

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
	$('.panel', this._el).show();
	$('table.result', this._el).empty().remove();
	$('.preset-result', this._el).empty();
	if (E2.ui)
		E2.ui.onSearchResultsChange();
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

	$lis.bind('mousedown',
		{
			dropSuccessCb: function(e) {
				that._cb($(e.target).data('path'))
			}
		},
		dragAndDropMouseDownHandler)

	this._resultEls = $lis

	if (this._resultEls.length)
		$(this._resultEls.get(0)).addClass('active')

	this._selectedIndex = 0
	
	if (E2.ui)
		E2.ui.onSearchResultsChange();

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
		var ltext = text.toLowerCase();
		var aTitle = a.title.toLowerCase();
		var bTitle = b.title.toLowerCase();
		if (ltext === aTitle)
			return -1
		if (ltext === bTitle)
			return 1
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
	oq = oq.toLowerCase()
	
	if (lstr.indexOf(oq) === 0)
		return 1000
	
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

	// Drag and drop an element from the list
	$('li', el).bind('mousedown', { dropSuccessCb: function(e) { that._cb($(e.target).data('path')) } }, dragAndDropMouseDownHandler)

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

	$input.on('blur', function(e) {
		jQuery(e.target).parent().parent().find('td.active').removeClass('active');
		return true;
	});

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
					setTimeout(function(){$input.trigger('blur');}, 100);
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

		// constrain
		var $res = $(res);
		if (that._selectedIndex >= $res.length)
			that._selectedIndex = $res.length - 1;
		if (that._selectedIndex < 0)
			that._selectedIndex = 0;

		$sel = $($res[that._selectedIndex])
		$sel.addClass('active')

		if ($sel.length > 0) {
			var selectionOffsetTop = $sel.offset().top;
			var selectionHeight = $sel.outerHeight(true);
			var $findParent = $sel.parents('.scrollbar');

			if ($findParent.length > 0) {
				var parentScrollHeight = $findParent.innerHeight();
				var parentOffsetTop = $findParent.offset().top;
				var parentScrollTop = $findParent.scrollTop();

				selectionOffsetTop -= parentOffsetTop;

				var newY = 0;
				if (selectionOffsetTop + selectionHeight >= parentScrollHeight) {
					newY = parentScrollTop + (selectionOffsetTop - parentOffsetTop) - selectionHeight;
					$findParent.scrollTop(newY);
				}
				else if (selectionOffsetTop <= 0) {
					newY = parentScrollTop - selectionHeight + selectionOffsetTop;
					if (newY < 0) newY = 0;
					$findParent.scrollTop(newY);
				}
			}
		}


	})

	return this;
}

if (typeof(module) !== 'undefined')
	module.exports = CollapsibleSelectControl
