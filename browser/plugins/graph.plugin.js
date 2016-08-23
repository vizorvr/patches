(function() {

var GraphPlugin = E2.plugins.graph = function(core) {
	AbstractGraphPlugin.apply(this, arguments)
}

GraphPlugin.prototype = Object.create(AbstractGraphPlugin.prototype)

})()