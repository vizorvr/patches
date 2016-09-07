if (typeof VizorUI === 'undefined')
	var VizorUI = {}

VizorUI.showHelpScreen = function(activeTab) {

	return new Promise(function(resolve, reject){

		var selectedGraph

		var data = {
			activeTab: activeTab || 'helpLinks',
			recent: [],
			examples: [],
			templates: []
		}

		var html = E2.views.patch_editor.helpscreen(data)
		var modal = VizorUI.modalOpen(html, null, /* className= */ 'welcome helpscreen')
		modal[0].id='helpscreen'
		VizorUI.replaceSVGButtons(modal)

		var helpContainer = modal[0].querySelector('#helpContainer')
		VizorUI.makeTabbed(helpContainer)

		$('.graph.card', modal)
			.each(function() {
				VizorUI.setupAssetCard($(this))
			})

		var chooseHandler = function(e){
			selectedGraph = "/data/graph" + e.detail.path + ".json"
			modal.modal('hide')
			return false
		}
		document.addEventListener('graph.choose', chooseHandler)

		modal.on('hide.bs.modal', function(){
			document.removeEventListener('graph.choose', chooseHandler)
			resolve(selectedGraph)
		})

		var loaded = {}

		function loadExamples(domEl) {
			if (loaded.examples)
				return
			var url = '/examples'
			domEl.classList.add('loading')
			$.get(url)
				.success(function(response){
					domEl.classList.remove('loading')
					loaded.examples = true
					var renderFlags = {
						withActionEdit: false,
						withActionView: false,
						withActionChoose: true,
						withLinks: false,
						withJSON: false
					}
					var html=[]
					var partial = E2.views.partials.assets.graphCard
					response.data.graphs.list.forEach(function(entry){
						html.push(partial(_.assign(entry, renderFlags)))
					})
					domEl.innerHTML = html.join("\n")
					$('.graph.card', domEl)
						.each(function() {
							VizorUI.setupAssetCard($(this))
						})
				})
				.fail(function(){
					domEl.classList.remove('loading')
				})
		}

		helpContainer.addEventListener(uiEvent.tabbedChanged, function(e){
			var tabId = e.detail.id
			switch (tabId) {
				case 'helpExamples':
					loadExamples(e.detail.tab)
			}
		})
	})
}