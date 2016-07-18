(function() {

var EntityPlugin = E2.plugins.entity = function(core) {
	AbstractGraphPlugin.apply(this, arguments)
	this.desc = '3D Entity Patch'
}

EntityPlugin.prototype = Object.create(AbstractGraphPlugin.prototype)

EntityPlugin.prototype.getObjectNode = function() {
	return this.graph.findNodeByPlugin('three_mesh')
}

EntityPlugin.prototype.getObject3D = function() {
	var meshNode = this.getObjectNode()

	if (!meshNode)
		return

	return meshNode.plugin.getObject3D()
}

})()
