(function() {

var modelsByExtension = {
	'.ogg': 'audio',
	'.ogv': 'video',
	'.jpg': 'image',
	'.png': 'image',
	'.js': 'scene',
	'.json': 'scene',
	'.obj': 'scene',
	'.gltf': 'scene',
	'.fbx': 'scene',
	'.dae': 'scene',
	'.zip': 'scene'
}

function uploadFile(file) {
	var dfd = when.defer()

	var fnl = file.name.toLowerCase()

	var extname = fnl.substring(fnl.lastIndexOf('.'))
	var modelName = modelsByExtension[extname]

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
					E2.ui.updateProgressBar(Math.floor(evt.loaded/evt.total * 100))
			}, false)

			return xhr
		},
		success: function(uploadedFile) {
			E2.track({
				event: 'uploaded', 
				modelName: modelName,
				path: uploadedFile.url
			})

			E2.ui.updateProgressBar(100)
			E2.models.fileList.addFile(file)
			uploadedFile.modelName = modelName
			dfd.resolve(uploadedFile)
		},
		error: function(err) {
			var errMsg = err.responseJSON ? err.responseJSON.message : err
			dfd.reject(errMsg)
		},
		data: formData,
		cache: false,
		contentType: false,
		processData: false,
		dataType: 'json'
	})

	return dfd.promise
}

// Traverse the pasted nodes and perform any fixup (fix
function postPasteFixup(nodes, fixupCallback) {
	function fixupNode(node) {
		if (E2.GRAPH_NODES.indexOf(node.plugin.id) > -1) {
			for (var i = 0, len = node.plugin.graph.nodes.length; i < len; ++i) {
				fixupNode(node.plugin.graph.nodes[i])
			}
		}

		if (fixupCallback)
			fixupCallback(node)
	}

	for (var i = 0, len = nodes.length; i < len; ++i) {
		fixupNode(nodes[i])
	}
}

function instantiatePluginForUpload(uploaded, position) {
	var dfd = when.defer()
	var pluginId

	// add a node to graph if graph visible
	switch(uploaded.modelName) {
		case 'image':
			pluginId = 'url_texture_generator'
			break;
		case 'scene':
			pluginId = 'three_loader_scene'
			break;
		case 'audio':
			pluginId = 'url_audio_buffer_generator'
			break;
		case 'video':
			pluginId = 'url_video_generator'
			break;
	}

	var node = E2.app.createPlugin(pluginId, position)
	node.plugin.state.url = uploaded.url

	E2.track({
		event: 'nodeAdded', 
		id: pluginId,
		fromUpload: true
	})

	E2.app.graphApi.addNode(E2.core.active_graph, node)

	dfd.resolve(node)

	postPasteFixup([node])

	return dfd.promise
}

function instantiateTemplateForUpload(asset, position) {
	var dfd = when.defer()

	var templateName
	var templateData = _.clone(asset)

	function fixupCallback(node) {
		if (node.plugin.id === 'three_mesh') {
			node.plugin.postLoadCallback = new TexturePlacementHelper()
		}

		if (node.plugin.id === 'three_loader_scene') {
			node.plugin.postLoadCallback = new ObjectPlacementHelper()
		}
	}

	console.info('instantiating template for asset', asset)

	if (!templateData.name) {
		templateData.name = asset.path
			.substring(asset.path.lastIndexOf('/') + 1)
	}
	
	// add to scene if graph not visible
	switch(asset.modelName) {
		case 'image':
			templateName = 'texture-plane.hbs'
			break;
		case 'scene':
			templateName = 'scene.hbs'
			break;
		case 'audio':
			templateName = 'audio.hbs'
			break;
		case 'video':
			templateName = 'video_plane.patch.hbs'
			break;
	}

	$.get('/patchTemplates/'+templateName)
	.done(function(templateSource) {
		var template = Handlebars.compile(templateSource)
		var patch = template(templateData)

		try {
			patch = JSON.parse(patch)
		} catch(err) {
			return dfd.reject(err)
		}

		E2.app.undoManager.begin('Drag & Drop Upload')

		E2.track({
			event: 'patchAdded', 
			name: templateName,
			fromUpload: true
		})

		var pasted = E2.app.pasteInGraph(E2.core.root_graph, patch, position[0], position[1])
		postPasteFixup(pasted.nodes, fixupCallback)

		if (E2.app.isWorldEditorActive() && asset.modelName !== 'audio') {
			E2.app.worldEditor.onEntityDropped(pasted.nodes[0])
		}

		E2.app.undoManager.end()

		dfd.resolve()
	})
	.fail(function(error) {
		dfd.reject(error)
	})

	return dfd.promise
}

/**
 * listen to file drops, and upload all accepted files to right category on server
 */
VizorUI.prototype.initDropUpload = function() {
	var that = this
	var target = $(document)

	E2.dom.dragOverlay.height(E2.dom.canvases.height())

	function cleanup() {
		E2.dom.dropUploading.hide()
		E2.dom.dragOverlay.hide()
		that.uploading = false
		$('body').css('pointerEvents', 'all')
		document.removeEventListener('visibilitychange', cleanup)
		return false
	}

	target.on('drop', function(e) {
		e.preventDefault();

		var dropPosition = [ e.clientX, e.clientY ]
		
		E2.dom.dropArea.hide()

		if (!E2.models.user.get('username')) {
			E2.dom.dragOverlay.hide()
			cleanup()
			return bootbox.alert('Please sign in before uploading.')
		}

		var files = e.originalEvent.dataTransfer.files;
		
		var acceptedFiles = []
		for (var i=0; i < files.length; i++) {
			var file = files[i]
			var fnl = file.name.toLowerCase()
			var extname = fnl.substring(fnl.lastIndexOf('.'))
			if (modelsByExtension[extname])
				acceptedFiles.push(file)
		}

		if (!acceptedFiles.length)
			return cleanup()

		E2.dom.dropUploading.show()

		that.uploading = true

		when.map(acceptedFiles, uploadFile)
		.catch(function(err) {
			bootbox.alert('Upload failed: ' + err)
		})
		.then(function(uploadedFiles) {
			return when.map(uploadedFiles, function(uploaded) {
				if (E2.ui.isPatchEditorVisible()) {
					return instantiatePluginForUpload(uploaded, dropPosition)
				} else {
					return instantiateTemplateForUpload(uploaded, dropPosition)
				}
			})
		})
		.then(function() {
			cleanup()
		})
		
		return false
	})

	target.on('dragenter', function(e) {
		e.stopPropagation()
		e.preventDefault()
		document.addEventListener('visibilitychange', cleanup)
	})
	
	target.on('dragover', function(e) {
		e.stopPropagation()
		e.preventDefault()

		$('body').css('pointerEvents', 'none')

		if (!that.isUploading()) {
			E2.dom.dragOverlay.show()
			E2.dom.dropArea.show()
		} else {
			return false
		}

		return true
	})
	
	target.on('dragleave dragend', function(e) {
		e.stopPropagation()
		e.preventDefault()

		// we get dragleave on CANVAS and HTML elements, drop the CANVAS ones
		if (e.target.tagName !== 'HTML')
			return;

		cleanup()

		return false
	})
}

})()

