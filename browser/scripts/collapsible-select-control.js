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
		.sort(function(a,b) {
			return b.score - a.score;
		})

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

CollapsibleSelectControl.prototype.scoreResult = function(q, resultStr) {
	var lstr = resultStr.toLowerCase().replace(/\//gim, '')
	var scr = 0

	function countInString(cc, str) {
		var count = 0
		var pos = str.indexOf(cc)
		while (pos !== -1) {
			count++
			pos = str.indexOf(cc, pos + 1)
		}
		return count
	}

	if (lstr.indexOf(q) > -1)
		return 100

	for(var i=0; i < q.length; i++) {
		var sofar = q.substring(0, i)

		if (lstr.indexOf(sofar) > -1)
			scr += q.length-i

		var qInStr = countInString(q[i], lstr)
		if (qInStr < countInString(q[i], q)) {
			return 0
		}
		scr += qInStr
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

		keyTimer = setTimeout(that._search.bind(that, $input.val(), 10))
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
