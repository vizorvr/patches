function SkeletonHelper( node ) {
	AbstractWorldEditorHelperObject.call(this)

	var that = this

	this.matrixAutoUpdate = false
	var mesh = new THREE.SkeletonHelper(node)
	mesh.matrix = new THREE.Matrix4()
	mesh.matrixAutoUpdate = true
	this.add(mesh)
	this.matrixAutoUpdate = false

	mesh.update()

	this.name = 'skeleton helper object'

	this.defaultPosition = new THREE.Vector3(0, 0, 0)
}

SkeletonHelper.prototype = Object.create( AbstractWorldEditorHelperObject.prototype )
