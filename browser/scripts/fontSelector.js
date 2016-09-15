var FontSelector = function() {
	this.fonts = [
	{
		name: 'Source Sans',
		id: 'source sans',
		url: '/data/fonts/Source Sans Pro_Regular.json'
	}, {
		name: 'Source Sans Bold',
		id: 'source sans bold',
		url: '/data/fonts/Source Sans Pro_Bold.json'
	}, {
		name: 'Helvetiker',
		id: 'helvetiker',
		url: '/data/fonts/helvetiker_regular.typeface.js'
	}, {
		name: 'Helvetiker Bold',
		id: 'helvetiker bold',
		url: '/data/fonts/helvetiker_bold.typeface.js'
	}]

	this.fontLoader = new THREE.FontLoader()

	this.getByIndex = function(idx) {
		return this.fonts[idx]
	}

	this.getById = function(id) {
		for(var i = 0, len = this.fonts.length; i < len; ++i) {
			if (this.fonts[i].id === id) {
				return this.fonts[i]
			}
		}
	}

	this.getIndex = function(font) {
		return this.fonts.indexOf(font)
	}


	this.createUi = function($ui, callback) {
		var $selectFont = $('<select class="font-type-sel" title="Select Font"/>')

		for (var i = 0, len = this.fonts.length; i < len; ++i) {
			var font = this.fonts[i]
			$('<option>', {value: i, text: font.name}).appendTo($selectFont)
		}

		var that = this

		$selectFont.change(function() {
			var newFont = that.getByIndex($selectFont.val())
			var selection = newFont.id

			if (!newFont.font) {
				that.fontLoader.load(newFont.url, function(font) {
					newFont.font = font
					callback(newFont, selection)
				})
			}
			else {
				callback(newFont, selection)
			}
		})

		$ui.append($selectFont)
	}

	this.initialise = function(ui, id) {
		var font = this.getById(id)
		var idx = this.getIndex(font)
		ui.find('.font-type-sel').val(idx)
	}
}

if (typeof(module) !== 'undefined')
	module.exports = FontSelector
