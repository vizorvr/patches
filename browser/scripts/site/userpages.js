var assetUIEvent = {	// CustomEvent names (dispatched on document)
	graphNew 		: 'graph.new',
	graphOpen 		: 'graph.open',
	graphEdit 		: 'graph.edit',
	graphDuplicate 	: 'graph.duplicate',
	graphMove 		: 'graph.move',
	graphDelete 	: 'graph.delete',
	graphPublish 	: 'graph.publish',
	graphDownload 	: 'graph.download',
	graphShare 		: 'graph.share',
	graphTogglePrivate : 'graph.toggleprivate'
	// projectNew		: 'project.new' etc.
}

var userpagesUI = new function() {

	// transitional
	this.setupCardUI = function(card) {
		var $card = jQuery(card)
		VizorUI.setupAssetCard($card)
		if (siteUI.isTouchCapable()) {
			var overlayDiv = this.querySelector('div.overlay')
			overlayDiv.addEventListener('click', VizorUI.touchCardOverlay, true)	// unbound, this=div
		}
	}

	this.init = function () {
		var that = this
		document.addEventListener(assetUIEvent.graphOpen, this.handleGraphOpen);

		jQuery('#contentcontainer .asset.card')
			.not('.new')
			.each(function () {
				that.setupCardUI(this)
			})

		document.addEventListener(assetUIEvent.graphShare, VizorUI.actionGraphShare)
		document.addEventListener(assetUIEvent.graphDelete, VizorUI.actionGraphDelete)
		document.addEventListener(assetUIEvent.graphTogglePrivate, VizorUI.actionGraphTogglePrivate)

		document.addEventListener('changed:profile', this.onProfileChanged.bind(this))
		document.addEventListener('changed:graph', this.onGraphCardChanged.bind(this))

		// login/signup links
		function accountHandler(action) {
			return function(e) {
				e.preventDefault()
				e.stopPropagation()
				action()
				.then(function(){window.location.reload()})
				return false
			}
		}
		jQuery('a#homeSignin').on('click', accountHandler(VizorUI.openLoginModal))
		jQuery('a#homeSignup').on('click', accountHandler(VizorUI.openSignupModal))

		if ((typeof UIPagination !== 'undefined') && document.body.classList.contains('bBrowse')) {
			UIPagination.bindNextLink(document.querySelector('div.pagination'), this.xhrPaginationCallback.bind(this))
	//		UIPagination.listen(document.querySelector('div.pagination'), this.xhrPagination.bind(this))
		}
	}

	// note the buttons are wired directly (for search-engine indexing)
	this.handleGraphOpen = function (e) {
		if (e && e.detail && e.detail.url) {
			e.preventDefault()
			e.stopPropagation()
			window.location.href = e.detail.url
		}
		return false
	}

	this.onProfileChanged = function (e) {
		var profileId = e.detail.id
		var profileData = Vizor.pageObjects.getProfile(profileId)
		if (!profileData)
			return
		var cards = VizorUI.findProfileCards(profileId)
		if (!cards.length)
			return

		Array.prototype.forEach.call(cards, function (div) {
			div.outerHTML = E2.views.partials.profile(profileData)
		})
	}

	this.onGraphCardChanged = function(e) {
		if (e.detail.key === 'private')
			return this._onGraphPrivateChanged(e)
	}

	// NB: called by onGraphCardChanged to handle private flag ONLY
	this._onGraphPrivateChanged = function(e) {

		var qs = 'article[data-objectid="' + e.detail.id + '"]'
		var isCardPrivate = e.detail.value

		var publicList = this.findPublicList()
		var privateList = this.findPrivateList()

		var card
		var cardData = Vizor.pageObjects.getGraph(e.detail.id)
		var isInPublic = false
		var isInPrivate = false

		// at least one list on the page
		isInPublic = publicList && (card = publicList.querySelector(qs))
		isInPrivate = privateList && !isInPublic && (card = privateList.querySelector(qs))

		if (!card)
			return console.error('could not find card?')

		if (isInPublic && isCardPrivate) {
			publicList.removeChild(card)
			if (privateList)
				this.addCardToList(card, privateList)
			else
				VizorUI.growl('Project "'+ cardData.prettyName +'" is now private.')

		}
		else if (isInPrivate && !isCardPrivate) {
			privateList.removeChild(card)
			if (publicList)
				this.addCardToList(card, publicList)
			else
				VizorUI.growl('Project "'+ cardData.prettyName +'" is now public.')
		}
		if (privateList)
			privateList.dataset.numitems = this.countCardsInList(privateList)
		if (publicList)
			publicList.dataset.numitems = this.countCardsInList(publicList)

	}

	this.findPublicList = function(el) {
		el = el || document
		return el.querySelector('section.list.assets.public')
	}

	this.findPrivateList = function(el) {
		el = el || document
		return el.querySelector('section.list.assets.private')
	}

	// counts the number of asset cards listed, minus the 'new' card
	this.countCardsInList = function(listEl) {
		return this.cardsInList(listEl).length
	}

	this.cardsInList = function(listEl) {
		return listEl.querySelectorAll('article.asset.card:not(.new)')
	}

	this.addCardToList = function(cardEl, listEl) {
		// privateList.appendChild(card)

		var beforeEl
		var sortId = cardEl.dataset.sortid
		if (sortId)
			beforeEl = this.findPositionForCard(sortId, listEl)

		if (beforeEl)
			listEl.insertBefore(cardEl, beforeEl)
		else
			listEl.appendChild(cardEl)
	}

	this.findPositionForCard = function(sortId, listEl) {	// e.g. sortId = graph.updatedTS
		// in the given listEl, find existingcard for list.insertBefore(card,existingcard)
		//  it is the element with highest data-sortid not bigger than sortId
		// NB: does not check if card is already in list!
		// (assumes list ordered descending)

		var qs = this.cardsInList(listEl)
		var card

		for (var l=0; l<qs.length; l++) {
			card = qs[l]
			if (card.dataset.sortid && (card.dataset.sortid <= sortId))
				break
			else
				card = null
		}

		return card
	}

	this.xhrPaginationCallback = function(response, oldPaginationContainer, display) {
		var that = this

		if (!(response && response.data && response.data.meta)) {
			console.info('?response', response)
		}
		var meta = response.data.meta
		var list = response.data.list
		// new
		var pagination = UIPagination.fromMeta(meta)
		var parent = oldPaginationContainer.parentElement
		parent.removeChild(oldPaginationContainer)

		var temp = document.createElement('DIV')

		temp.innerHTML = E2.views.partials.browse.graphList({list: response.data, withPagination:true})

		var scripts = temp.getElementsByTagName('script')
		while (scripts.length)
			scripts[0].parentElement.removeChild(scripts[0])

		var cards = temp.querySelectorAll('article.card')
		Array.prototype.forEach.call(cards, function(card){
			if ((card.tagName.toLowerCase() === 'article') && card.classList.contains('card'))
				that.setupCardUI(card)
		})

		while (temp.childNodes.length) {
			parent.parentElement.appendChild(temp.firstChild)	// this won't execute
		}

		if (list.length && Vizor.pageObjects.addGraph) {
			for (var graph of list) {
				Vizor.pageObjects.addGraph(graph)
			}
		}

		var paginationContainer = parent.parentElement.querySelector('div.pagination')
		if (paginationContainer) {
			UIPagination.bindNextLink(paginationContainer, this.xhrPaginationCallback.bind(this))
			// seeing we added this, we can take out the previous link
			var prevLink = paginationContainer.querySelector('a.prev.page')
			if (prevLink) {
				prevLink.className = 'scrollto top'
				prevLink.innerHTML = '^'
				prevLink.href = '#top_'
				VizorUI.enableScrollToLinks(paginationContainer)
			}
		}

		// UIPagination.listen(parent.parentElement.querySelector('div.pagination'), this.xhrPagination.bind(this))
	}
}

document.addEventListener('DOMContentLoaded', userpagesUI.init.bind(userpagesUI))