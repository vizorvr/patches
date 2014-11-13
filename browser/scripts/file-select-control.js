function TagControl($input) {
	var that = this;

	function tagify(input) {
		return input.split(' ')
		.filter(function(val)
		{
			return val !== '#' && val.length > 0;
		})
		.map(function(val)
		{
			if (!val.length || val[0] === '#')
				return val;

			return '#' + val;
		});
	}

	$input.on('keyup', function()
	{
		setTimeout(function()
		{
			var tags = tagify($input.val());
			that.trigger('change', tags);
			$input.val(tags.join(' '));
		}, 0);

		return true;
	});
};
_.extend(TagControl.prototype, Backbone.Events);

function FileSelectControl(handlebars) {
	var that = this;

	this._handlebars = handlebars || window.Handlebars
	this._files = []
	this._cb = function() {}
	this._buttons = {
		'Cancel': this.cancel.bind(this),
		'Ok': this.close.bind(this)
	}

	this._templateName = 'filebrowser/generic';
	this._frameName = 'filebrowser/frame';

	// load templates
	['texture', 'upload', 'tags']
	.forEach(function(pname)
	{
		var partialName = 'filebrowser/'+pname;
		that._handlebars.registerPartial(partialName, that._handlebars.getTemplate(partialName));
	});

	this._frameTemplate = this._handlebars.getTemplate(this._frameName);
}

FileSelectControl.prototype.template = function(name)
{
	this._templateName = name;
	return this;
};

FileSelectControl.prototype.frame = function(name)
{
	this._frameName = name;
	return this;
};

FileSelectControl.prototype.url = function(url)
{
	this._url = url;
	return this;
};

FileSelectControl.prototype.files = function(files)
{
	this._files = files.map(function(file)
	{
		if (typeof(file) === 'string')
			return { path: file };

		return file;
	});

	return this;
};

FileSelectControl.prototype.selected = function(file) {
	this._original = file
	this._selected = file
	return this
};

FileSelectControl.prototype.onChange = function(cb) {
	this._cb = cb;
	return this;
};

FileSelectControl.prototype.buttons = function(buttons) {
	this._buttons = buttons;
	return this;
};

FileSelectControl.prototype.modal = function()
{
	this._render();
	return this;
};

FileSelectControl.prototype._renderFiles = function(tags)
{
	var template = this._handlebars.getTemplate(this._templateName);
	var files = this._files;

	if (tags)
	{
		files = files.filter(function(file)
		{
			return tags.every(function(tag)
			{
				return file.tags.indexOf(tag) > -1;
			});
		});
	}

	var html = template(
	{
		original: this._original,
		url: this._url,
		user: E2.models.user.toJSON(),
		files: files
		.map(function(file)
		{
			if (file._creator)
				file._creator = file._creator.username;

			file.selected = (file.url === self._selected);
			file.name = file.path.substring(file.path.lastIndexOf('/')+1);
			return file;
		})
	});

	return html;
};

FileSelectControl.prototype._render = function()
{
	var self = this;

	var frame = $(this._frameTemplate(
	{
		original: this._original,
		url: this._url,
		user: E2.models.user.toJSON()
	}));

	$('.file-selector', frame).html(this._renderFiles());

	var el = bootbox.dialog(
	{
		message: frame
	});

	this._el = el;
	this._inputEl = $('#file-url', this._el);
	this._selectedEl = $('tr.selected', this._el);

	// add buttons
	var btnEl = $('.buttons', el)

	Object.keys(this._buttons).map(function(name) {
		$('<button class="btn btn-default">'+name+'</button>')
		.click(function(e) {
			e.preventDefault();
			e.stopPropagation();
			self._buttons[name].call(self, self._inputEl.val(), self._tagsEl.val());
			self.close();
			return false;
		})
		.appendTo(btnEl);
	});

	$('button:last', el)
		.removeClass('btn-default')
		.addClass('btn-primary');

	// bind file rows and click handlers
	function _onClick(e) {
		var tr = $(e.target).closest('tr');
		$('tr.success', el).removeClass('success');
		tr.addClass('success');
		self._onSelect(tr);
	}

	$('.file-row', el).click(_onClick);
	$('.file-row', el).dblclick(function(e) {
		_onClick(e);
		self._onChange();
	});

	$('input', el).on('change', this._onChange.bind(this))
	$('button.close', el).click(this.close.bind(this))

	el.bind('keydown', this._onKeyPress.bind(this))

	// show selected file when modal is opened
	$(el).on('shown.bs.modal', function (e) {
		if (!self._selectedEl.length)
			return;

		$('table', el).scrollTop(0)
			.scrollTop(
				self._selectedEl.position().top
				- self._selectedEl.height()
				* 10)
	});

	// bind upload form
	this._bindUploadForm();

	// attach TagControl to tags input
	this._tagsEl = $('#tags', el);
	new TagControl(this._tagsEl)
	.on('change', function(tags)
	{
		$('.file-selector', frame).html(self._renderFiles(tags));
	});

	// show
	el.appendTo('body')
	.attr("tabindex", -1)
	.focus();

	return this;
};

FileSelectControl.prototype._bindUploadForm = function()
{
	var that = this;
	var $form = $('form.fileUploadForm', this._el);

	if (!$form)
		return;

	$form.on('submit', function(e)
	{
		e.preventDefault();
		e.stopPropagation();

		var formData = new FormData($form[0]);
		$.ajax(
		{
			url: $form[0].action,
			type: 'POST',
			success: function()
			{
				bootbox.alert('Uploaded successfully!');
				self.close();
			},
			error: function(err)
			{
				bootbox.alert('Upload failed: '+err.msg);
			},
			data: formData,
			cache: false,
			contentType: false,
			processData: false,
			dataType: 'json'
		});

		$form.html('<h4>Please wait...</h4>');

		return false;
	});
};

FileSelectControl.prototype._onKeyPress = function(e) {
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
	};
};

FileSelectControl.prototype._scroll = function(amt) {
	var tab = $('table', this._el);
	tab.scrollTop(tab.scrollTop() + amt * this._selectedEl.height());
};

FileSelectControl.prototype._onChange = function() {
	this._cb(this._inputEl.val());
};

FileSelectControl.prototype._onSelect = function(row) {
	var path = row.data('url');

	this._selectedEl.removeClass('selected');
	row.addClass('selected');

	this._selectedEl = row;
	this._inputEl.val(path);
	this._onChange();
};

FileSelectControl.prototype.cancel = function() {
	this._cb(this._original);
	this.close();
};

FileSelectControl.prototype.close = function() {
	$(this._el).modal('hide');
};

// ------------------------------------------

function createSelector(path, selected, okButton, okFn, cb)
{
	var ctl = new FileSelectControl();

	okButton = okButton || 'Ok';
	okFn = okFn || function() {};

	if (selected && selected.indexOf('://') === -1)
		selected = selected.substring(selected.lastIndexOf('/') + 1);

	$.get(path, function(files)
	{
		var buttons = {
			'Download': function(file) {
				var url = '/dl' + path + file;
				var iframe = $('#dl-frame');
				if (!iframe.length)
					iframe = $('<iframe id="dl-frame">').hide().appendTo('body');
				iframe.attr('src', url);
			},
			'Cancel': function() {}
		};

		buttons[okButton] = okFn;

		ctl
		.url(path)
		.buttons(buttons)
		.files(files)
		.selected(selected)

		cb(ctl)
	});

	return ctl;
};

FileSelectControl.createGraphSelector = function(selected, okButton, okFn)
{
	return createSelector('/graph', selected, okButton, okFn, function(ctl)
	{
		ctl
		.template('filebrowser/generic')
		.modal();
	});
};

FileSelectControl.createVideoSelector = function(selected, okButton, okFn)
{
	return createSelector('/video', selected, okButton, okFn, function(ctl)
	{
		ctl
		.modal();
	});
};

FileSelectControl.createJsonSelector = function(selected, okButton, okFn)
{
	return createSelector('/json', selected, okButton, okFn, function(ctl)
	{
		ctl
		.modal();
	});
};

FileSelectControl.createAudioSelector = function(selected, okButton, okFn)
{
	return createSelector('/audio', selected, okButton, okFn, function(ctl)
	{
		ctl
		.modal();
	});
};

FileSelectControl.createSceneSelector = function(selected, okButton, okFn)
{
	return createSelector('/scene', selected, okButton, okFn, function(ctl)
	{
		ctl
		.modal();
	});
};

FileSelectControl.createTextureSelector = function(selected, okButton, okFn)
{
	return createSelector('/image', selected, okButton, okFn, function(ctl)
	{
		ctl
		.template('filebrowser/texture')
		.modal();
	});
};

FileSelectControl.createForUrl = function(path, selected, okButton, okFn) {
	return createSelector(path, selected, okButton, okFn, function(ctl)
	{
		ctl
		.modal();
	});
}

if (typeof(exports) !== 'undefined')
	exports.FileSelectControl = FileSelectControl;
