(function() {

class GoogleAnalyticsPlugin extends Plugin {
  constructor(core, node) {
    super(core, node)
    this.desc = 'Lets you track views and Vizor events in your own Google Analytics property.'
    this.input_slots = [{
      name: 'trackingId',
      dt: core.datatypes.TEXT,
      desc: 'Google Analytics property Tracking ID'
    }]
    this.output_slots = []
    this.state = { trackingId: null }
    this.currentId = null
  }
  update_input(slot, data) {
    this.state.trackingId = data
  }
  update_state() {
    this._createTracker()
  }
  _createTracker() {
    if (!this.state.trackingId
      || this.currentId === this.state.trackingId
      || typeof ga === 'undefined')
      return

    ga('create', this.state.trackingId, 'auto', 'clientTracker')
    this.currentId = this.state.trackingId
  }
  state_changed(ui) {
    if (!ui)
      return

    this._createTracker()
  }
}

E2.plugins.google_analytics = GoogleAnalyticsPlugin

})()
