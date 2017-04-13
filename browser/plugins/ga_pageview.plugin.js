(function() {

class GAPageViewPlugin extends Plugin {
  constructor(core, node) {
    super(core, node)
    this.desc = 'Reports a page view (as a hash under the experience URL) to GA any time the input changes. Sets `page` first, then calls `pageview`.'
    this.input_slots = [{
      name: 'hash',
      dt: core.datatypes.TEXT,
      desc: 'The location hash to report to GA.'
    }]
    this.output_slots = []
    this.currentPage = null
  }
  update_input(slot, data) {
    if (!data || typeof ga === 'undefined')
      return

    var locationHash = '#' + data

    if (this.currentPage === locationHash)
      return

    this.currentPage = locationHash

    ga('clientTracker.set', 'page', window.location.pathname + locationHash)
    ga('clientTracker.send', 'pageview')
  }
}

E2.plugins.ga_pageview = GAPageViewPlugin

})()
