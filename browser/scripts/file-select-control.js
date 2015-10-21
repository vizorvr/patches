function TagControl($input, $fileList) {
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
			$fileList.filterByTags(tags);
			$input.val(tags.join(' '));
		}, 0);

		return true;
	});
};
_.extend(TagControl.prototype, Backbone.Events);

function FileSelectControl(handlebars) {
	EventEmitter.call(this)

	var that = this;

	this._handlebars = handlebars || window.Handlebars
	this._frame = null;
	this._fileList = new FileList();
	this._fileList.on('change:files', this._onFilesChange, this);

	this._cb = function() {}
	this._buttons = {
		'Cancel': this.cancel.bind(this),
		'Ok': this.close.bind(this)
	}

	this._template = E2.views.filebrowser.generic;
	this._frameTemplate = E2.views.filebrowser.frame;

	// setup partials
	['upload', 'tags']
	.forEach(function(pname)
	{
		that._handlebars.registerPartial('filebrowser/'+pname, E2.views.filebrowser[pname]);
	});
}

FileSelectControl.prototype = Object.create(EventEmitter.prototype)

FileSelectControl.prototype._onFilesChange = function(model) {
	if (!this._frame)
		return;

	$('.file-selector', this._frame).html(this._renderFiles());
	this._bindTable();
};

FileSelectControl.prototype.template = function(name)
{
	this._template = E2.views.filebrowser[name];
	return this;
};

FileSelectControl.prototype.frame = function(name)
{
	this._frameTemplate = E2.views.filebrowser[name];
	return this;
};

FileSelectControl.prototype.url = function(url)
{
	this._url = url;
	return this;
};

FileSelectControl.prototype.files = function(files)
{
	var items = files.map(function(file)
	{
		if (typeof(file) === 'string')
			return { path: file };

		return file;
	});

	this._fileList.setFiles(items);

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

FileSelectControl.prototype.header = function(header) {
	this._header = header;
	return this;
};

FileSelectControl.prototype.modal = function()
{
	this._render();
	return this;
};

FileSelectControl.prototype._renderFiles = function()
{
	var that = this;
	var files = this._fileList.get('files');
	var html = this._template(
	{
		original: this._original,
		url: this._url,
		user: E2.models.user.toJSON(),
		files: files
		.map(function(file)
		{
			if (file._creator)
				file._creator = file._creator.username;

			if (!file.url)
				file.url = file.path;

			file.selected = (file.path === that._selected);
			if (!file.name)
				file.name = file.path.substring(file.path.lastIndexOf('/')+1);
			file.updatedAt = moment(file.updatedAt).fromNow();
			return file;
		})
	});

	return html;
};

FileSelectControl.prototype._render = function()
{
	var self = this;

	this._frame = $(this._frameTemplate(
	{
		original: this._original,
		url: this._url,
		user: E2.models.user.toJSON()
	}));

	$('.file-selector', this._frame).html(this._renderFiles());

	var el = bootbox.dialog({
		title: this._header,
		message: this._frame
	}).init(function() {
		$('.modal-dialog').addClass('file-select-dialog');
	});

	this._el = el;
	this._inputEl = $('#file-url', el);
	this._selectedEl = $('tr.success', el);

	// add buttons
	var buttonsRow = $('#buttons-row', el);

	var keypressFn = this._onKeyPress.bind(this);
	el[0].addEventListener('keydown', keypressFn);

	function clickHandler(buttonCb) {	// #732 return false from your handler to prevent the panel closing
		return function(e) {
			e.preventDefault();
			e.stopPropagation();
			var okToClose = buttonCb.call(self, self._inputEl.val());
			if (okToClose !== false) {
				el[0].removeEventListener('keydown',keypressFn);
				self.close();
			}
			return false;
		}
	}


	Object.keys(this._buttons).map(function(name)
	{
		var btn = self._buttons[name];
		$('<td>').append(
			$('<button class="btn btn-default" id="fbBtn'+name+'">'+name+'</button>')
				.click(clickHandler(btn))
		).appendTo(buttonsRow);
	});
	
	$('button:last', el)
		.removeClass('btn-default')
		.addClass('btn-primary');


	// bind file rows and click handlers
	this._bindTable();

	$('input', el).on('change', this._onChange.bind(this))
//	$('button.close', el).click(this.close.bind(this))

	// show selected file when modal is opened
	$(el).on('shown.bs.modal', function (e) {
		if (!self._selectedEl.length)
			return;

		$('table', el).scrollTop(0)
			.scrollTop(
				self._selectedEl.position().top
				- self._selectedEl.height()
				* 10);
	});

	// bind upload form
	this._bindUploadForm();

	return this;
};

FileSelectControl.prototype._bindTable = function() {
	var self = this;

	// bind file rows and click handlers
	function _onClick(e) {
		var tr = $(e.target).closest('tr');
		$('tr.success', self._el).removeClass('success');
		tr.addClass('success');
		self._onSelect(tr);
	}

	$('.file-row', self._el).click(_onClick);
	$('.file-row', self._el).dblclick(function(e) {
		_onClick(e);
		self._onChange();
		self.ok();
	});
}

FileSelectControl.prototype._bindUploadForm = function() {
	var that = this;
	var container = $('#upload', this._el);
	var $form = $('form.fileUploadForm', container);
	var browsebutton = $('.browse-button');
	var fileUploadName = $('#fileUploadName');
	var fileUploadFile = $('#fileUploadFile');
	
	browsebutton.click(function(e) {
		fileUploadFile.trigger('click')
		return false
	})
	
	fileUploadName.click(function() {
		fileUploadFile.trigger('click')
		return false
	})
	
	fileUploadFile.on('change', function() {
		fileUploadName.val(fileUploadFile.val())
	})
	
	if (!$form)
		return

	$form.on('submit', function(e) {
		e.preventDefault()
		e.stopPropagation()

		$('.progress', container).show()
		var $progress = $('.progress-bar', container)

		var formData = new FormData($form[0])
		$.ajax({
			url: $form[0].action,
			type: 'POST',
			xhr: function() {
				var xhr = $.ajaxSettings.xhr();
				xhr.upload.addEventListener('progress', function(evt) {
					if (evt.lengthComputable)
						$progress.css('width', Math.floor(evt.loaded/evt.total * 100) + '%');
				}, false)

				return xhr
			},
			success: function(file) {
				$progress.removeClass('active')

				$('#message', container).html('<h4>Uploaded successfully!</h4>')
				that.selected(file.path)
				that._fileList.addFile(file)

				setTimeout(function() {
					that._onSelect($('tr.file-row:first', that._el))
					$('.nav-tabs a:first', that._el).tab('show')
				}, 1000)
			},
			error: function(err) {
				$progress
					.removeClass('active')
					.removeClass('progress-bar-info')
					.addClass('progress-bar-danger')

				$('#message', container).html('<h4>Upload failed: ' +
					err.responseJSON ? err.responseJSON.message : err +
					'</h4>')
			},
			data: formData,
			cache: false,
			contentType: false,
			processData: false,
			dataType: 'json'
		})

		$('#message', container).html('<h4>Please wait...</h4>')

		return false
	})
}

FileSelectControl.prototype._onKeyPress = function(e) {
	e.stopPropagation();
	switch(e.keyCode) {
		case 27:
			this.cancel();
			break;
		case 13:
			e.preventDefault();
			this.ok();
			break;
		case 38:
			e.preventDefault();
			var prev = this._selectedEl.prev('tr');
			if (prev.length)
				this._onSelect(prev);
			this._scroll(-1);
			break;
		case 40:
			e.preventDefault();
			var next = this._selectedEl.next('tr')
			if (next.length)
				this._onSelect(next);
			this._scroll(1);
			break;
	}
	return true;
};

FileSelectControl.prototype._scroll = function(amt) {
	if (!this._selectedEl.length)
		return;

	var container = $('.fixed-table-container-inner');
	var threshold = 4 * this._selectedEl.height();
	container.scrollTop(this._selectedEl.offset().top - container.offset().top + container.scrollTop() - threshold);
};

FileSelectControl.prototype._onChange = function() {
	this._cb(this._inputEl.val());
};

FileSelectControl.prototype._onSelect = function(row) {
	var path = row.data('url');

	this._selectedEl.removeClass('success');
	row.addClass('success');

	this._selectedEl = row;
	this._inputEl.val(path);
	this._onChange();
};

FileSelectControl.prototype.ok = function() {
	$('button.btn:last', this._el).click();
};

FileSelectControl.prototype.cancel = function() {
	this._cb(this._original);
	this.close();
};

FileSelectControl.prototype.close = function() {
	bootbox.hideAll();
	this.emit('closed')
};

// ------------------------------------------

function createSelector(path, selected, okButton, okFn, cb)
{
	var ctl = new FileSelectControl();

	okButton = okButton || 'Ok';
	okFn = okFn || function() {};

	if (selected && selected.indexOf('://') === -1)
		selected = selected.substring(selected.lastIndexOf('/') + 1);

	E2.ui.updateProgressBar(65);

	$.get(path, function(files)
	{
		E2.ui.updateProgressBar(100);

		var buttons = {
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
	if (E2.ui.isModalOpen()) return null;
	var ctl = new FileSelectControl();

	okButton = okButton || 'Ok';
	okFn = okFn || function() {};

	if (selected && selected.indexOf('://') === -1)
		selected = selected.substring(selected.lastIndexOf('/') + 1);

	E2.ui.updateProgressBar(65);

	$.get('/graph', function(files)
	{
		E2.ui.updateProgressBar(100);

		var buttons = {
			// 'Copy to clipboard': function(file)
			// {
			// 	$.get('/data/graph'+file+'.json', function(d)
			// 	{
			// 		E2.app.fillCopyBuffer(d.root.nodes, d.root.conns, 0, 0);
			// 	});
			// }
			'Cancel': function() {}
		};

		buttons[okButton] = okFn;

		var selectedPath;

		ctl
			.url('/graph')
			.frame('graph-frame')
			.template('graph')
			.buttons(buttons)
			.files(files)
			.selected(selected)
			.onChange(function(path) {
				$('.links').show();
				selectedPath = path;
			})
			.modal();

		$('.links .download').click(function(e) {
			e.preventDefault();
			e.stopPropagation();
			window.open('/dl/data/graph'+selectedPath+'.json');
		});

		$('.links .clipboard').click(function(e) {
			e.preventDefault();
			e.stopPropagation();
			$.get('/data/graph'+selectedPath+'.json', function(d)
			{
				E2.app.fillCopyBuffer(d.root.nodes, d.root.conns, 0, 0);
				ctl.close();
			});
			return false;
		});

		$('.links').hide();
	});

	return ctl;
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

FileSelectControl.createPresetSelector = function(selected, okButton, okFn) {
	return createSelector('/preset', selected, okButton, okFn, function(ctl) {
		ctl
		.modal()
	})
}

FileSelectControl.createSceneSelector = function(selected, okButton, okFn)
{
	return createSelector('/scene', selected, okButton, okFn, function(ctl)
	{
		ctl
		.modal();
	});
};

FileSelectControl.createTextureSelector = function(selected, cb){
	return createSelector('/image', selected, 'Select', function(){}, cb)
}

FileSelectControl.createModelSelector = function(model, selected, cb){
	return createSelector('/'+model, selected, 'Select', function(){}, cb)
}

FileSelectControl.createForUrl = function(path, selected, okButton, okFn) {
	return createSelector(path, selected, okButton, okFn, function(ctl)
	{
		ctl
		.modal();
	});
}

if (typeof(exports) !== 'undefined')
	exports.FileSelectControl = FileSelectControl;
