if (typeof VizorUI === 'undefined')
	var VizorUI = {}


VizorUI.actionGraphShare = function(e) {
	var url = e.detail.url
	var origin = window.location.origin
	var data = {
		origin: origin,
		shareURL : origin + url,
		embedSrc : origin + "/embed" + url
	}
	return VizorUI.graphShareDialog(data, {title: "Share"})
}

VizorUI.actionGraphDelete = function(e) {
	if (!(e && e.detail))
		return console.error('no event detail')

	var id = e.detail.id
	var data = {
		_id : id,
		path: e.detail.url
	}

	return VizorUI.requireConfirm('Are you sure you want to delete this?')
		.then(function(){
			var xhr = $.ajax({
				url: e.detail.url,
				type: 'DELETE',
				data: data
			}).done(
				function(response){
					var cards = VizorUI.findAssetCards(id)
					if (!cards.length) return

					var title = 'Project'

					var pageObjects = window.Vizor.pageObjects
					if (pageObjects && pageObjects.deleteGraph) {
						var scene = pageObjects.getGraph(id)
						title = '"' + scene.prettyName + '"'
						pageObjects.deleteGraph(id)
					}

					Array.prototype.forEach.call(cards, function(/* HTMLElement */ card, ix){
						card.parentNode.removeChild(card)
					})

					VizorUI.notifyBySite(title + " was deleted")
				})
				.fail(function(response){
					console.error(response)
					alert('failed to delete ' + id)
				})
			return xhr
		}).catch(function(ex) {	// xhr
			if (ex)
				console.error(ex)
		})
}

VizorUI.actionGraphTogglePrivate = function(e) {
	if (!(e && e.detail))
				return console.error('no event detail')
	// find card
	var graph = Vizor.pageObjects.getGraph(e.detail.id)
	if (!graph)
		return void console.error('could not find card ' + e.detail.id)

	var data = {
		'private': !graph.private
	}
	var checkbox = e.detail.triggeredByEl
	return $.post(graph.path, data)
		.done(function(response){
			var data = response.data
			// change the label too
			checkbox.parentElement.dataset.content = (data.private) ? "Make public" : "Make private"
			// repaint|reposition card
			graph.private = data.private
		})
		.fail(function(ex){
			// restore the toggle if the call failed
			var message = 'could not make "' + graph.prettyName + '" ' + (graph.private ? 'public' : 'private')
			VizorUI.growl(message)
			checkbox.checked = graph.private
			console.error(ex)
		})
}

VizorUI.findAssetCards = function(id) {
	return document.querySelectorAll("article.card[data-objectid='"+id+"']")
}

VizorUI.findProfileCards = function(id) {
	return document.querySelectorAll("div.user-profile[data-objectid='"+id+"']")
}

// only bound if device is touch-capable
VizorUI.touchCardOverlay = function(e) {
	/* @var this HTMLElement div */
	var el = e.target
	var that = this
	// if focussed but the click is on something inside, then let it through
	if (this.classList.contains('focus')) {
		if ((el.tagName !== 'DIV') || !el.classList.contains('overlay')) {
			return true
		}
	} else {
		// stop this click occasionally going to child elements on mobile
		e.stopPropagation()
		e.preventDefault()
	}

	var focussed = document.querySelectorAll('article.card div.overlay.focus')
	Array.prototype.forEach.call(focussed, function(overlay){
		if (overlay !== that)
			overlay.classList.remove('focus')
	})
	this.classList.toggle('focus')
}