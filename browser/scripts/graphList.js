
function getGraphList(graphsPath, cb) {
	$.get(graphsPath, cb)
}

function renderGraphList(graphsPath) {
	var source   = $("#fileListEntryTemplate").html();
	var template = Handlebars.compile(source);

	getGraphList(graphsPath, function(list) {
		var elem = $('#graphs-list')
		elem.html(template({ files: list }))
		$('.fileListEntry', elem).click(function(e) {
			E2.dom.filenameInput.val(
				$(e.target).text()
			)
		})
	})
}

