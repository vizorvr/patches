function FileSelectControl(handlebars) {
	this._handlebars = handlebars || window.Handlebars
	this._files = []
	this._cb = function() {}
	this._buttons = {
		'Cancel': this.cancel.bind(this),
		'Ok': this.close.bind(this)
	}
}

FileSelectControl.prototype.files = function(files)
{
	this._files = files.map(function(file)
	{
		if (typeof(file) === 'string')
			return { name: file };

		return file;
	});

	return this;
}

FileSelectControl.prototype.selected = function(file) {
	this._original = file
	this._selected = file
	return this
}

FileSelectControl.prototype.onChange = function(cb) {
	this._cb = cb
	return this;
}

FileSelectControl.prototype.buttons = function(buttons) {
	this._buttons = buttons;
	return this;
}

FileSelectControl.prototype.modal = function() {
	this._render()
	$('.modal', this._el).modal({ backdrop: false })
	return this
}

FileSelectControl.prototype._render = function() {
	var self = this;

	var el = $('<div class="file-select-control">');
	this._el = el;

	this._template = this._handlebars.getTemplate('filebrowser/filebrowser');

	el.html(this._template({
		original: this._original,
		files: this._files.map(function(file)
		{
			return {
				name: file.name,
				selected: file.name === self._selected
			};
		})
	}));

	var btnEl = $('.modal-footer', el)

	Object.keys(this._buttons).map(function(name) {
		$('<button class="btn btn-default">'+name+'</button>')
			.click(function() {
				self._buttons[name].call(self, self._inputEl.val());
				self.close();
			})
			.appendTo(btnEl)
	})

	$('button:last', el)
		.removeClass('btn-default')
		.addClass('btn-primary')

	this._inputEl = $('input', this._el)
	this._selectedEl = $('tr.selected', this._el)

	function _onClick(e) {
		self._onSelect($(e.target).closest('tr'))
	}

	$('.file-row', el).click(_onClick)
	$('.file-row', el).dblclick(function(e) {
		_onClick(e)
		$('button:last', el).click()
	})

	$('input', el).on('change', this._onChange.bind(this))
	$('button.close', el).click(this.close.bind(this))

	$('.modal', el)
		.on('hidden.bs.modal', function (e) {
			el.empty().remove()
		});

	$('.modal', el)
		.on('shown.bs.modal', function (e) {
			if (!self._selected)
				return;

			$('table', el).scrollTop(0)
				.scrollTop(
					self._selectedEl.position().top
					- self._selectedEl.height()
					* 10)
		});

	el.bind('keydown', this._onKeyPress.bind(this))
		.appendTo('body')
		.attr("tabindex", -1)
		.focus();

	return this
}

FileSelectControl.prototype._onKeyPress = function(e) {
	// console.log('e.keyCode', e.keyCode)
	switch(e.keyCode) {
		case 27:
			this.cancel()
			break;
		case 13:
			$('button:last', this._el).click()
			break;
		case 38:
			var prev = this._selectedEl.prev('tr')
			if (prev.length)
				this._onSelect(prev)
			this._scroll(-1)
			break;
		case 40:
			var next = this._selectedEl.next('tr')
			if (next.length)
				this._onSelect(next)
			this._scroll(1)
			break;
	}
}

FileSelectControl.prototype._scroll = function(amt) {
	var tab = $('table', this._el)
	tab.scrollTop(tab.scrollTop() + amt * this._selectedEl.height())
}

FileSelectControl.prototype._onChange = function() {
	this._cb(this._inputEl.val());
}

FileSelectControl.prototype._onSelect = function(row) {
	var name = row.data('name');

	this._selectedEl.removeClass('selected')
	row.addClass('selected')

	this._selectedEl = row

	this._inputEl.val(name)

	this._onChange()
}

FileSelectControl.prototype.cancel = function() {
	this._cb(this._original)
	this.close()
}

FileSelectControl.prototype.close = function() {
	$('.modal', this._el).modal('hide')
}

// ------------------------------------------

FileSelectControl.createForUrl = function(path, selected, okButton, okFn) {
	var ctl = new FileSelectControl();

	okButton = okButton || 'Ok';
	okFn = okFn || function() {};

	if (selected && selected.indexOf('://') === -1)
		selected = selected.substring(selected.lastIndexOf('/') + 1);

	$.get(path, function(files)
	{
		var buttons = {
			'Download': function(file) {
				var url = '/dl/' + path + file;
				var iframe = $('#dl-frame');
				if (!iframe.length)
					iframe = $('<iframe id="dl-frame">').hide().appendTo('body');
				iframe.attr('src', url);
			},
			'Cancel': function() {}
		};

		buttons[okButton] = okFn;

		ctl
		.buttons(buttons)
		.files(files)
		.selected(selected)
		.modal()
	});

	return ctl
}

if (typeof(exports) !== 'undefined')
	exports.FileSelectControl = FileSelectControl;
