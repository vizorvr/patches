(function() {

var TEXT_CONFIRM_REMOVE_INPUT = 'Really remove this input?'

function addInputDialog(cb) {
	var validDatatypes = {
		FLOAT: E2.dt.FLOAT,
		TEXTURE: E2.dt.TEXTURE,
		COLOR: E2.dt.COLOR,
		MATRIX: E2.dt.MATRIX,
		VECTOR: E2.dt.VECTOR,
	}

	return function() {
		var t = $('<form action="#" class="addInputDialog">'+
			'<label>Name<input type="text" class="name form-control"/><span>(use as variable name in code)</span></label>'+
			'<br/><label>Datatype<select class="dt form-control"/></label></form>')
		
		var $modal, $dtSelect
		var name, dt

		function destroy() {
			$modal.empty().remove()
			cb(name, dt)
		}

		function ok() {
			name = $modal.find('input.name').val().replace(/[^\w]/gi, '_')
			dt = E2.dt[$dtSelect.val()]
			destroy()
		}

		$modal = bootbox.dialog({
			animate: false,
			title: 'Add Shader input',
			message: t,
			closeButton: false,
			onEscape: destroy,
			buttons: {
				Cancel: destroy,
				Ok: ok
		 	}
		})

		$dtSelect = $modal.find('select.dt')
		_.each(validDatatypes, function(dt, key) {
			$dtSelect.append('<option value="'+key+'">'+dt.name+'</option>')
		})

		$('input', $modal).focus()

		$('form.addInputDialog', $modal).on('submit', function(e) {
			ok()
			e.preventDefault()
			e.stopPropagation()
			return false
		})
	}
}

function InputEditor(inputs) {
	this._cb = null
	this._inputs = inputs
	EventEmitter.call(this)
}
InputEditor.prototype = Object.create(EventEmitter.prototype)
InputEditor.prototype.render = function($el) {
	var that = this

	var $inputs = $('.inputs', $el)

	function inputButton(inputName, glslType) {
		var t = '<button title="Remove input" '+
			'class="btn btn-xs btn-default input-remove-button input-button">'+
			'<i class="fa fa-sm fa-close"></i><span>{{glslType}} {{title}}</span></button>';

		return $(t.replace('{{title}}', inputName).replace('{{glslType}}', glslType))
			.click(function(e) {
				if (window.confirm(TEXT_CONFIRM_REMOVE_INPUT)) {
					$(e.target).closest('button').remove()
					that.emit('removed', that._inputs[inputName].id, inputName)
				}
			})
	}

	// add buttons for inputs
	$inputs.prepend(_.map(this._inputs, function(i, key) {
		return inputButton(key, i.dt.name)
	}))

	// 'add input' dialog
	$('.input-add-button', $el).click(addInputDialog(function(name, dt) {
			if (!name)
				return

			$inputs.find('.input-add-button').before(inputButton(name, dt.name))
			that.emit('added', name, dt)
	}))
}

// ----------
function createAce(src, elId) {
	var editor = ace.edit(elId)
	var $el = $('#'+elId)

    editor.setTheme('ace/theme/tomorrow_night_eighties');
    editor.setAutoScrollEditorIntoView(true);
    editor.setOption('maxLines', 80);
    editor.setOption('minLines', 40);
	editor.getSession().setUseWrapMode(false)
	editor.setBehavioursEnabled(true)
	editor.setShowPrintMargin(false)
	editor.getSession().setMode('ace/mode/glsl')
	editor.setValue(src)
	editor.gotoLine(0)
	editor.session.selection.clearSelection()

	return editor
}

// ----------
function ShaderEditor(handlebars, src, inputs) {
	this._handlebars = handlebars || window.Handlebars

	this._autoBuild = true
	this._src = src
	this._inputs = inputs

	EventEmitter.call(this)
}

ShaderEditor.prototype = Object.create(EventEmitter.prototype)

ShaderEditor.prototype.getAce = function() {
	return this._ace
}

ShaderEditor.prototype.close = function() {
	this._ace.destroy()
	this._$el.empty()
	this.emit('closed')
}

ShaderEditor.prototype.build = function(force) {
	if (this._autoBuild || force)
		this.emit('build')
}

ShaderEditor.prototype.show = function() {
	this.emit('shown')
}

ShaderEditor.prototype.render = function(title, $dest) {
	var that = this
	var template = E2.views.ui.shader
	var id = 'shader-ace-' + Date.now()

	var $html = this._$el = $(template({
		title: title,
		src: this._src,
		id: id
	}))

	var $inputEditor = $('.input-editor', $html)
	var $aceParent = $('.shader-ace', $html).parent()

	$('.auto-build', $html).change(function() {
		that._autoBuild = !that._autoBuild
	})

	$('.compile-button', $html).click(that.build.bind(that, true))

	$dest.append($html)

	this._ace = createAce(this._src, id)
	this._ace.on('change', function() {
		that.emit('changed', that._ace.getValue())
		that.build()
	})
	this._ace.commands.addCommand({
		name:'build',
		bindKey: {
			win: 'Alt-enter',
			mac: 'Alt-enter|Command-enter'
		},
		exec: function() {
			that.build(true)
	}})

	this._inputEditor = new InputEditor(this._inputs)
		.on('removed', function(slotId, name) {
			that.emit('inputRemoved', slotId, name)
			that.build()
		})
		.on('added', function(name, dtid) {
			that.emit('inputAdded', name, dtid)
			that.build()
		})
		.render($inputEditor)

	function _onResize() {
		var height = $aceParent.height() - $inputEditor.height() - 20;
		that._ace.setOption('minLines', Math.floor(height / 16));
		that._ace.setOption('maxLines', Math.floor(height / 16));
	}

    E2.app.player.core.renderer.on('resize', _onResize)

    _onResize()

	return this
}

// ---- static methods

ShaderEditor.open = function(name, src, inputs)
{
	var editor
	var tab = E2.app.midPane.newTab(name, function() {
		if (editor)
			editor.close()
	})

	editor = new ShaderEditor(window.Handlebars, src, inputs)
		.render(name, tab.body)

	editor.on('shown', tab.show)
	editor.on('closed', tab.close)

	return editor
};

E2.ShaderEditor = ShaderEditor;



})()