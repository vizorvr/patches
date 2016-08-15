if (typeof uiEvent === 'undefined')
	uiEvent = {}

uiEvent.tabbedChanged = 'tabbed:changedActive'

if (typeof VizorUI === 'undefined')
	VizorUI = {}

/**
 * click to toggle visible section in e.g. a div.
 * tabbed.less has the automatic css, setup for div.tabbed + section 
 * specify data-activetab="(targetId)" to switch to that tab upon init
 * add class tab-flex to toggle visible tab to display:flex instead of display:block
 * access tabbed element via document.getElementById('...')._tabbed
 * @example
 * <div class="tabbed" data-activetab="tab2">
 *     <nav><a href="#tab1">1</a>
 *     		<a href="#tab2">2</a></nav>
 *     <section id="tab1">...</section>
 *     <section id="tab2">...</section>
 * </div>
 * @param containerEl HTMLElement
 */
VizorUI.makeTabbed = function(containerEl) {

	if (containerEl._tabbed)
		console.warn('container tabs already setup', containerEl)

	var nav 	= containerEl.querySelector('nav')
	var links 	= nav.querySelectorAll('a[href^="#"]')
	var contentSelector = Array.prototype.map.call(links, function(link){
	 	return 'section' + link.getAttribute('href')
	})
	var contents = containerEl.querySelectorAll(contentSelector.join(','))

	var clearActive = function(el){
		delete el.dataset['active']
	}

	var activetab = containerEl.dataset['activetab']
	delete containerEl.dataset['activetab']

	// by now we have links + contents(sections)
	containerEl._tabbed = {
		get active() {
			return containerEl.dataset['activetab']
		},
		set active(contentId) {	// e.g .active='mytab' (from <a href="#mytab">)
			if (contentId === this.active)
				return contentId

			var content = containerEl.querySelector('#'+contentId)
			if (content) {
				var link = nav.querySelector('a[href^="#'+contentId+'"]')
				Array.prototype.forEach.call(links, clearActive)
				link.dataset['active'] = true

				Array.prototype.forEach.call(contents, clearActive)
				content.dataset['active'] = true

				containerEl.dataset['activetab'] = contentId
				containerEl.dispatchEvent(new CustomEvent(uiEvent.tabbedChanged, {
					detail:{
						id: contentId,
						tab: content,
						triggeredBy: link
					}
				}))
			} else {
				console.warn('could not find contentId #'+contentId)
			}
			return this.active
		}
	}

	var attachLink = function(link) {
		if (link._tabbed)
			link.removeEventListener('click', link._tabbed._handler)

		var handler = function(e) {
			e.preventDefault()
			var href = this.getAttribute('href').split('#')[1]
			containerEl._tabbed.active = href
			return true
		}
		link._tabbed = {
			_handler : handler
		}
		link.addEventListener('click', handler)
	}

	Array.prototype.forEach.call(links, attachLink)

	// init
	containerEl.classList.add('tabbed')
	containerEl._tabbed.active = activetab
}