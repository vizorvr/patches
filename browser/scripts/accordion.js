$.get('/snippets/snippets.json', function(data) {
	var snippets = Object.keys(data).map(function(catTitle) {
		return {
			title: catTitle,
			items: Object.keys(data[catTitle]).map(function(snipTitle) {
				return {
					title: snipTitle,
					path: data[catTitle][snipTitle]
				}
			})
		}
	})

	new CollapsibleSelectControl()
		.data(snippets)
		.render()
})

function CollapsibleSelectControl(handlebars) {
	this._handlebars = handlebars || Handlebars;
	this._template = this._handlebars.compile(
		$("#collapsible-select-template").html());
}

CollapsibleSelectControl.prototype.data = function(d) {
	d[0].open = true
	this._data = d
	return this;
}

CollapsibleSelectControl.prototype.render = function() {
	var el = $('<div class="collapsible-select-control">')
	this._el = el

	el.html(this._template({
		controlId: "col-sel-"+Date.now(),
		snippets: this._data
	}))

	this._el.on('hide.bs.collapse', function(e) {
		$('.glyphicon', $(e.target).prev())
			.removeClass('glyphicon-chevron-down')
			.addClass('glyphicon-chevron-right')
	})

	this._el.on('show.bs.collapse', function(e) {
		$('.glyphicon', $(e.target).prev())
			.addClass('glyphicon-chevron-down')
			.removeClass('glyphicon-chevron-right')
	})

	el.appendTo('body')

	return this;
}
