(function() {

function ThreeSixtyUi(uploader, publisher) {
	this.uploader = uploader
	this.publisher = publisher

	this.dom = {
		controlsDiv: null
	}

	this.minProgress = 0 // allow half+half progress bar
}

ThreeSixtyUi.prototype.clearBodyClass = function() {
	this.$body.removeClass('dragentered dragover dragover-dropzone uploading error')
}

ThreeSixtyUi.prototype.updateProgressBar = function(percent) {
	this.$progress.val(percent)
	this.minProgress = percent
}

ThreeSixtyUi.prototype.errorHandler = function(message, details) {
	that.displayError(message, details)
}

ThreeSixtyUi.prototype.displayError = function(message, details, heading) {
	if (!(message || details)) 
		return

	heading = heading || 'Error'

	playerUI.selectStage('errorStage')

	var html = E2.views.partials.error({
		message: message,
		code: details
	})

	console.error(message, details)

	window.Vizor.disableHeaderClick = true

	VizorUI.modalOpen(html, heading, 'error doselect_all', true, {
		callback: function() {}
	})
}

// STEP 4
ThreeSixtyUi.prototype.loadGraphAndPlay = function(asset) {
	var that = this

	if (!asset)
		return;

	// Load from the JSON url in the asset
	this.clearBodyClass()

	E2.core.once('player:stateChanged', function(s) {
		if (s === E2.app.player.state.PLAYING) {
			that.$body.removeClass('firsttime')
			that.minProgress = 0
			playerUI.headerFadeOut()
			return true
		}

		return false
	})

	Vizor.shareURL = window.location.origin + asset.path
	Vizor.embedSrc = window.location.origin + '/embed' + asset.path
	playerUI.headerEnableAutoFadeout()
	history.pushState({}, '', asset.path)

	E2.track({
		event: 'ThreeSixty Playing Graph',
		path: asset.path
	})

	$('#sharebutton').show()
	$('#edit').show()
}

ThreeSixtyUi.prototype.dragEnterHandler = function(e) {
	this.$body.addClass('dragentered')

	playerUI.headerFadeOut(100)

	E2.track({ event: 'ThreeSixty DragEnter' })

	e.stopPropagation()
	e.preventDefault()

	lastDragTarget = e.target

	return false
}

ThreeSixtyUi.prototype.dragLeaveHandler = function(e) {
	E2.track({ event: 'ThreeSixty DragLeave' })

	e.stopPropagation()
	e.preventDefault()

	if (e.target === lastDragTarget)
		this.$body.removeClass('dragentered')
	
	return false
}

ThreeSixtyUi.prototype.addUploadButton = function() {
	var data = {
		id: 'uploadbutton',
		text: 'Upload',
		svgref: 'vr360-upload-image'
	}
	var button = E2.views.partials.controls.svgButton(data)

	var handler = function(e) {
		e.preventDefault()
		$('#threesixty-image-input').focus().trigger('click')
		return false
	}

	var btn = $(button)
	btn.appendTo(this.dom.controlsDiv)
	btn[0].addEventListener('click', handler)
}

ThreeSixtyUi.prototype.addTOSButton = function() {
	var data = {
		href: 'https://docs.google.com/document/d/172dWVz8bSEDxS_y2InXpqWhVvbM7w1Z9MSp1-Lw1rIc/edit?usp=sharing',
		id: 'tosbutton',
		text: 'Terms',
		svgref : 'vr360-tos',
		target: '_blank'
	}
	var button = E2.views.partials.controls.svgButton(data)
	$(button).appendTo(this.dom.controlsDiv)
}

ThreeSixtyUi.prototype.addCancelButton = function() {
	var ls = document.getElementById('container360')
	if (!ls) return

	var b = document.createElement('button')
	b.id = 'cancelbutton'
	b.innerHTML = 'Cancel'
	ls.appendChild(b)
}

ThreeSixtyUi.prototype.init = function() {
	var that = this

    VizorPlayerUI.headerDefaultFadeoutTimeMs = 3500

	this.dom.controlsDiv = document.getElementById('topbar').getElementsByTagName('div')[1]

	var $header = $('header')
	var $container360 = $('#container360')
	$container360.remove()
	$header.append($container360)
	this.$body = $('body')
	this.$progress = $('#progressbar')

	this.$body.addClass('firsttime')

	this.addUploadButton()
	this.addCancelButton()
	this.addTOSButton()
	
	var fileSelectHandler = this.uploader.fileSelectHandler.bind(this.uploader)
	var dragEnterHandler = this.dragEnterHandler.bind(this)
	var dragLeaveHandler = this.dragLeaveHandler.bind(this)

	// File drop handler
	var drop_zone = document.getElementById('drop-zone')
	drop_zone.addEventListener('drop', fileSelectHandler)

	// Needs to be defined also for the 'drop' event handler to work
	drop_zone.addEventListener('dragover', function(evt) {
		E2.track({ event: 'ThreeSixty DragOver' })
		evt.stopPropagation()
		evt.preventDefault()
	})

	// File input picker
	var file_input = document.getElementById('threesixty-image-input');
	file_input.addEventListener("change", fileSelectHandler)

	// Show/hide the overlay
	window.addEventListener("dragenter", dragEnterHandler)
	window.addEventListener("dragleave", dragLeaveHandler)

	if (!window.Vizor)
		window.Vizor = {}

	window.Vizor.hideVRbutton = true
	window.Vizor.autoplay = true
	
	window.Vizor.onProgress = function(pct) {
		var factor = 100 / (100 - that.minProgress)
		var ret = that.minProgress + pct / factor;
		playerUI.onProgress(ret)
	}

	window.onpopstate = function(event) {
		if (event.state && event.state.initial) 
			window.location = window.location
	}

	history.replaceState({
		initial: true
	}, null)

	E2.core.on('assetsLoaded', function() {
		if (window.Vizor && (Vizor.graphName === '')) {
			playerUI.headerDisableAutoFadeout()
			$('#sharebutton').hide()
			$('#edit').hide()
		}
	})

	this.uploader.on('uploading', function() {
		that.clearBodyClass()
		that.$body.addClass('uploading')
	})

	this.publisher.on('progress', function(pct) {
		that.updateProgressBar(pct)
	})

	this.uploader.on('progress', function(pct) {
		that.updateProgressBar(pct)
	})

	this.uploader.on('beforeUpload', function() {
		E2.app.player.pause()
		window.Vizor.disableHeaderClick = true
		that.$body.removeClass('firsttime')
	})

	this.uploader.on('uploaded', function() {
		window.Vizor.disableHeaderClick = false
	})

	this.uploader.on('cancelled', function() {
		window.Vizor.disableHeaderClick = false
		$('#threesixty-image-input').val('')

		that.updateProgressBar(0)
		that.clearBodyClass()

		E2.app.player.play()
	})
}

window.ThreeSixtyUi = ThreeSixtyUi

})()
