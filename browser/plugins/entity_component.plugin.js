(function() {

var EntityComponentPlugin = E2.plugins.entity_component = function(core) {
	AbstractGraphPlugin.apply(this, arguments)

	this.desc = 'Entity Component Patch. Contains a behavior for a 3D Entity.'
}

EntityComponentPlugin.prototype = Object.create(AbstractGraphPlugin.prototype)

})()