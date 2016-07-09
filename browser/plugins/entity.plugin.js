(function() {

var EntityPlugin = E2.plugins.entity = function(core) {
	AbstractGraphPlugin.apply(this, arguments)
	this.desc = '3D Entity Patch'
}

EntityPlugin.prototype = Object.create(AbstractGraphPlugin.prototype)

})()