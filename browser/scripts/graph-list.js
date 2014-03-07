
function render_graph_list(graphsPath, inputEl)
{
	var source   = $("#file-list-entry-template").html();
	var template = Handlebars.compile(source);

	$.get(graphsPath, function(list) {
		var elem = $('#graphs-list')
		elem.html(template({ files: list }))
		$('.file-list-entry', elem).click(function(e) {
			inputEl.val($(e.target).text())
		})
	})
}

