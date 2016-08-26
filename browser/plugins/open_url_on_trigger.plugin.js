(function() {

var OpenUrlOnTrigger = E2.plugins.open_url_on_trigger = function(core) {
	Plugin.apply(this, arguments)

	this.desc = 'Navigates to the URL (away from experience) on trigger'

	this.input_slots = [{
		name: 'trigger', 
		dt: core.datatypes.BOOL,
		desc: 'When trigger is true, the URL will be loaded in the browser',
		def: null
	}, {
		name: 'url',
		dt: core.datatypes.TEXT,
		desc: 'Absolute URL to navigate to, eg. http://vizor.io/',
		def: null
	}]

	this.output_slots = []
}

OpenUrlOnTrigger.prototype = Object.create(Plugin.prototype)

OpenUrlOnTrigger.prototype.update_state = function() {
	if (this.inputValues.trigger && this.inputValues.url)
		window.location.href = this.inputValues.url
}

})()