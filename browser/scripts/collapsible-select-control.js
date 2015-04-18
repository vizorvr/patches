function CollapsibleSelectControl(handlebars) {
	this._handlebars = handlebars || Handlebars
	this._cb = function() {}
}

CollapsibleSelectControl.prototype.template = function(template) {
	this._template = template
	return this
}

CollapsibleSelectControl.prototype.data = function(d) {
	this._data = d
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
	$('.panel li', this._el).show()
	$('.panel-collapse', this._el).removeClass('in')
}

CollapsibleSelectControl.prototype._search = function(text) {
	if (!text) {
		this._reset()
		return
	}

	$('.panel li', this._el).hide()
	$('.panel', this._el).hide()

	var re = new RegExp(text, 'im')

	var lis = $('.panel li', this._el)
		.filter(function() {
			return re.test(this.innerHTML)
		})

	lis.closest('.panel').show()
	lis.closest('.panel-collapse').addClass('in')

	lis.show()

	this._resultEls = $('.panel-body li:visible', this._el)

	if (this._resultEls.length)
		$(this._resultEls.get(0)).addClass('active')

	this._selectedIndex = 0

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

	$input.on('keyup', function(e) {
		if (e.keyCode === 27) {
			e.stopPropagation()
			return $input.blur()
		}

		if (e.keyCode === 38 || e.keyCode === 40)
			return;

		that._search($input.val())
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
					// $input.select()
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

		$($(res)[that._selectedIndex]).addClass('active')
	})

	return this;
}
