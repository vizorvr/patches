// POST graph to the server
function uploadGraph(graphData, callback) {
	console.log("uploading graphData");
	console.dir(graphData);

	$.ajax({
		url: '/graph/',
		type: 'POST',
		data: graphData,
		dataType: 'json',
		success: callback,

		error: function(err) {
			var errMsg = err.responseJSON ? err.responseJSON.message : err
		},
	})
}

// Fetch the 360 template from our server and publish a graph with 
// image url from passed in url
function publishTemplateWithUrl(imageUrl) {
	console.log("publishing stereo template with imageUrl = " + imageUrl);

	// TODO: do we need to use a FQN here ?
	var templateUrl = "/presets/_template-360-photo.json";

	$.ajax({
		url: templateUrl,
		type: 'GET',
		dataType: 'json',

		success: function(graph) {
			var urlReplaced = false;

			// Go through the graph 'nodes' field and find the URL
			// for the 360 template we are replacing
			var nodes = graph.root.nodes;
			for (var i=0; i<nodes.length; i++) {
				var node = nodes[i];

				// Check if we have the correct node, the 360 graph 
				// has this node generating the texture
				if (node.plugin === 'url_texture_generator') {
					node.state.url = imageUrl;
					urlReplaced = true;
				}
			}

			// Found the url, generate the graph data and upload
			if (urlReplaced === true) {
				var name = genGraphUid();
				var data = {
					'path': name,
					'graph': JSON.stringify(graph)
				};

				uploadGraph(data, function(asset) {
					// Redirect the client to the published graph
					// Use href so back works
					window.location.href = asset.path;
				});
			}
		},

		error: function(err) {
			var errMsg = err.responseJSON ? err.responseJSON.message : err;
			console.log(errMsg);
		},
	})
}

function uploadFile(file, modelName, callback) {
	var fnl = file.name.toLowerCase()
	var extname = fnl.substring(fnl.lastIndexOf('.'))

	var formData = new FormData()
	formData.append('filename', file.name)
	formData.append('file', file)

	$.ajax({
		url: '/upload/' + modelName,
		type: 'POST',
		data: formData,
		cache: false,
		contentType: false,
		processData: false,
		dataType: 'json',

		xhr: function() {
			var xhr = $.ajaxSettings.xhr()
				xhr.upload.addEventListener('progress', function(evt) {
					if (evt.lengthComputable)
						//E2.ui.updateProgressBar(Math.floor(evt.loaded/evt.total * 100))
						// TODO: update real progress
						console.log(evt.loaded/evt.total * 100);
				}, false)

			return xhr
		},

		success: function(uploadedFile) {
			callback(uploadedFile);
		},

		error: function(err) {
			var errMsg = err.responseJSON ? err.responseJSON.message : err
			console.log(errMsg);
		},
	})
}

function fileSelectHandler(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var file_path;

	// Either read from the dataTransfer (when drag and dropped)
	// or from the target.files (when file browsed)
	if (evt.dataTransfer !== undefined) {
		file_path = evt.dataTransfer.files[0];
	} else if (evt.target.files !== undefined) {
		file_path = evt.target.files[0];
	}

	if (file_path.type.match('image.*') === null) {
		// TODO: error handling
		alert("File type doesn't match");
		return;
	}

	uploadFile(file_path, "image", function(uploadedFile) {
		if (uploadedFile !== undefined) {
			// Get the scaled version of the original image
			var imageUrl = uploadedFile.scaled.url;
			if (imageUrl !== undefined) {
				publishTemplateWithUrl(imageUrl);
			}
		}
	});
};

function addEventHandlers() {
	// Local File drop handlers
	var drop_zone = document.getElementById('drop-zone-360-image');
	drop_zone.addEventListener("dragover", dropZoneDragOverHandler);
	drop_zone.addEventListener("drop", fileSelectHandler);

	// The file input picker
	var file_input = document.getElementById('360-image-input');
	drop_zone.addEventListener("change", fileSelectHandler);
}

function dropZoneDragOverHandler(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = "copy";
};

function genGraphUid() {
	var keys = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
	var uid = ''

	for (var i=0; i < 12; i++) {
		uid += keys[Math.floor(Math.random() * keys.length)]
	}

	return uid
};
