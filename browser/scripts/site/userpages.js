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

	this.init = function () {
		document.addEventListener(assetUIEvent.graphOpen, this.handleGraphOpen);

		jQuery('#contentcontainer .asset.card').each(function () {
			var $card = jQuery(this)
			VizorUI.setupAssetCard($card)
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
	}

	// currently unused as the buttons are wired directly (for search-engine indexing)
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
		var profileData = Vizor.page.getProfile(profileId)
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
		var cardData = Vizor.page.getGraph(e.detail.id)
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
				VizorUI.growl('made "'+ cardData.prettyName +'" private')

		}
		else if (isInPrivate && !isCardPrivate) {
			privateList.removeChild(card)
			if (publicList)
				this.addCardToList(card, publicList)
			else
				VizorUI.growl('made "'+ cardData.prettyName +'" public')
		}
		if (privateList)
			privateList.dataset.numitems = this.countCardsInList(privateList)
		if (publicList)
			publicList.dataset.numitems = this.countCardsInList(publicList)

	}

	this.findPublicList = function(el) {	// omit el for document
		el = el || document
		return el.querySelector('section.list.assets.public')
	}

	this.findPrivateList = function(el) {
		el = el || document
		return el.querySelector('section.list.assets.private')
	}

	// counts the number of asset cards listed, minus the new one
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
		// in the given listEl,
		// find the element that has the biggest data-sortid not bigger than sortId
		// returns e.g. existingcard to use in list.insertBefore(card,existingcard)
		// NB: does not check if card is already in list!

		var qs = this.cardsInList(listEl)
		var card

		// (assumes list is ordered by date desc (sortid desc))
		for (var l=0; l<qs.length; l++) {
			card = qs[l]
			if (card.dataset.sortid <= sortId)
				break
			else
				card = null
		}

		return card
	}
}

document.addEventListener('DOMContentLoaded', userpagesUI.init.bind(userpagesUI))