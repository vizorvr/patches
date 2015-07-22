(function() {

function getForkName(path) {
	var p = path.split('-').join('/').split('/')
	var name = p[0]
	
	if (p.length > 1)
		name = p[0] + '-' + p[1]

	name = name + '-' + E2.uid()

	return name;
}


function ForkCommand() {}

ForkCommand.prototype.fork = function(editAction) {
	// save the current graph as an object
	var graphSer = E2.core.serialise()

	var forkName = getForkName(E2.app.path)

	history.pushState({}, null, '/' + forkName)
	E2.app.path = forkName

	return E2.app.setupEditorChannel()
		.then(function() {
			// dispatch the old graph as a snapshot in the log
			E2.app.dispatcher.dispatch({
				actionType: 'graphSnapshotted',
				data: graphSer
			})

			if (!editAction)
				return;

			// shove the original edit on top
			editAction.graphUid = E2.core.active_graph.uid
			E2.app.channel.send(editAction)
		})
}

if (typeof(exports) !== 'undefined')
	exports.ForkCommand = ForkCommand
else
	window.ForkCommand = ForkCommand

})();

