function CollapsibleSelectControl(handlebars) {
	this._handlebars = handlebars || Handlebars;
	this._template = this._handlebars.compile($("#collapsible-select-template").html());
	this._cb = function() {};
}

CollapsibleSelectControl.prototype.data = function(d) {
	this._data = d;
	return this;
}

CollapsibleSelectControl.prototype.onOpen = function(cb) {
	this._cb = cb;
	return this;
}

CollapsibleSelectControl.prototype.focus = function() {
	$('input', this._el).focus();
}

CollapsibleSelectControl.prototype._reset = function() {
	$('.panel', this._el).show();
	$('.panel li', this._el).show();
	$('.collapse').collapse('hide');
}

CollapsibleSelectControl.prototype._search = function(text) {
	if (!text) {
		this._reset();
		return;
	}

	$('.panel li', this._el).hide();
	$('.panel', this._el).hide();

	var re = new RegExp(text, 'im');

	var lis = $('.panel li', this._el)
		.filter(function() {
			return re.test(this.innerHTML)
		});

	lis.closest('.panel').show();
	lis.closest('.panel-collapse').show();
	lis.closest('.collapse').collapse('show');

	lis.show();
}

CollapsibleSelectControl.prototype.render = function(el) {
	var self = this;
	
	el = el || $('<div class="collapsible-select-control">').appendTo('body');
	this._el = el;

	el.html(this._template({
		controlId: "col-sel-"+Date.now(),
		categories: this._data
	}));

	el.on('hide.bs.collapse', function(e) {
		$('.glyphicon', $(e.target).prev())
			.removeClass('glyphicon-chevron-down')
			.addClass('glyphicon-chevron-right');
	});

	el.on('show.bs.collapse', function(e) {
		$('.glyphicon', $(e.target).prev())
			.addClass('glyphicon-chevron-down')
			.removeClass('glyphicon-chevron-right');
	});

	$('input', el).on('keyup', function() {
		self._search($('input', el).val());
	});

	$('li', el).dblclick(function(e) {
		self._cb($(e.target).data('path'));
	});

	return this;
}
