
function getGraphList(cb) {
	$.get('/graphs', cb)
}

function renderGraphList() {
	var source   = $("#fileListEntryTemplate").html();
	var template = Handlebars.compile(source);

	getGraphList(function(list) {
		var elem = $('#graphs-list')
		elem.html(template({ files: list }))
		$('.fileListEntry', elem).click(function(e) {
			E2.dom.filenameInput.val(
				$(e.target).text()
			)
		})
	})
}


