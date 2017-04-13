(function() {

function GoogleAnalyticsPlugin() {
  Plugin.apply(this, arguments)
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
GoogleAnalyticsPlugin.prototype = Object.create(Plugin.prototype)
GoogleAnalyticsPlugin.prototype.update_input = function(slot, data) {
  this.state.trackingId = data
}
GoogleAnalyticsPlugin.prototype.update_state = function() {
  this._createTracker()
}
GoogleAnalyticsPlugin.prototype._createTracker = function() {
  if (!this.state.trackingId
    || this.currentId === this.state.trackingId
    || typeof ga === 'undefined')
    return

  ga('create', this.state.trackingId, 'auto', 'clientTracker')
  this.currentId = this.state.trackingId
}
GoogleAnalyticsPlugin.prototype.state_changed = function(ui) {
  if (!ui)
    return

  this._createTracker()
}

E2.plugins.google_analytics = GoogleAnalyticsPlugin

})()
