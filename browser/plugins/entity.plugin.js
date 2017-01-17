(function() {

var EntityPlugin = E2.plugins.entity = function() {
	AbstractEntityPlugin.apply(this, arguments)
	this.desc = '3D Entity Patch'
}

EntityPlugin.prototype = Object.create(AbstractEntityPlugin.prototype)

})()
