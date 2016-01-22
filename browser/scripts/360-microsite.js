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
			alert(errMsg);
		},
	})
}

// Fetch the 360 template from our server and publish a graph with 
// image url from passed in url
function publishTemplateWithUrl(image_url) {
	console.log("publishing stereo template with image_url = " + image_url);

	// TODO: change to this to actual working production url
	// maybe we need to add a route or someway serve this static file
	var template_url = "/presets/_template-360-photo.json";

	$.ajax({
		url: template_url,
		type: 'GET',
		dataType: 'json',

		success: function(graph) {
			var url_replaced = false;

			// So .. now we need to replace the url object in ..
			// this json object
			//
			// Go through the graph 'nodes' field
			var nodes = graph.root.nodes;
			for (var i=0; i<nodes.length; i++) {
				var node = nodes[i];

				// Check if we have the correct node, the 360 graph 
				// has this node generating the texture
				if (node.plugin === 'url_texture_generator') {
					console.log("replacing url " + node.state.url + " with url = " + image_url);
					node.state.url = image_url;
					url_replaced = true;
				}
			}

			// Now .. we need to publish this scene somehow and then get the UID for that and open
			// the player with that
			//
			// So we want to post this as JSON to the server /graph
			if (url_replaced === true) {
				// Generate a unique ID for this graph
				var name = genGraphUid();
				var data = {
					'path': name,
					'graph': JSON.stringify(graph)
				};

				uploadGraph(data, function(asset) {
					console.log("upload of graph complete");

					// Redirect the client to the published graph
					var redirect_url = asset.path;
					window.location.href = redirect_url;
				});
			}
		},

		error: function(err) {
			var errMsg = err.responseJSON ? err.responseJSON.message : err;
			console.log(errMsg);
		},
	})
}

function uploadFile(file, modelName) {
	//var dfd = when.defer()

	var fnl = file.name.toLowerCase()
	var extname = fnl.substring(fnl.lastIndexOf('.'))

	var formData = new FormData()
	formData.append('filename', file.name)
	formData.append('file', file)

	$.ajax({
		url: '/upload/' + modelName,
		type: 'POST',

		xhr: function() {
			var xhr = $.ajaxSettings.xhr()
				xhr.upload.addEventListener('progress', function(evt) {
					if (evt.lengthComputable)
						//E2.ui.updateProgressBar(Math.floor(evt.loaded/evt.total * 100))
						console.log(evt.loaded/evt.total * 100);
				}, false)

			return xhr
		},

		success: function(uploadedFile) {
			// So here we get the file from the server .. 
			//
			// Now we need to get the template
			// Replace the correct 'url' field in there with the one now residing on the server
			//
			// so .. we need to fetch the template json file
			// Then pass both that and the uploaded file to the function
			// that will handle the replacing of the url
			console.dir(uploadedFile);

			// Get the scaled version of the original image
			var image_url = uploadedFile.scaled.url;
			if (image_url !== undefined) {
				publishTemplateWithUrl(image_url);
			}
		},

		error: function(err) {
			var errMsg = err.responseJSON ? err.responseJSON.message : err
				alert(errMsg);
		},

		data: formData,
		cache: false,
		contentType: false,
		processData: false,
		dataType: 'json'
	})

	//return dfd.promise
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
		alert("File type doesn't match");
		return;
	}

	uploadFile(file_path, "image");
};

function initDropZone() {
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
