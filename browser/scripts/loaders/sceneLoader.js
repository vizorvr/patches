(function() {

function SceneLoader() {
	E2.Loaders.ModelLoader.apply(this, arguments)
}
SceneLoader.prototype = Object.create(E2.Loaders.ModelLoader.prototype)

SceneLoader.prototype.loadJson = function(url) {
	var loader = new MultiObjectLoader()
	loader.crossOrigin = 'Anonymous'
	loader.load(
			url,
			this.onObjLoaded.bind(this),
			this.onHierarchyLoaded.bind(this),
			this.progressHandler.bind(this),
			this.errorHandler.bind(this))
}

SceneLoader.prototype.onHierarchyLoaded = function(scene) {
	if (scene.scene) {
		this.object3d = new THREE.Object3D()
		this.object3d.copy(scene.scene, /*recursive = */false)

		while (scene.scene.children.length > 0) {
			var obj = scene.scene.children[0]
			scene.scene.remove(obj)
			this.object3d.add(obj)
		}
	}
	else {
		this.object3d = scene
	}

	this.emit('loaded', this.object3d)
}

SceneLoader.prototype.onObjLoaded = function(geoms, mats) {
	var hasMorphAnimations = geoms.length > 0 && geoms[0].morphTargets && geoms[0].morphTargets.length > 0

	var createMesh = hasMorphAnimations ?
			function(geom, mat) {return new THREE.MorphAnimMesh(geom, mat)}
		:   function(geom, mat) {return new THREE.Mesh(geom, mat)}

	if (geoms.length === 1 && mats.length === 1) {
		this.object3d = createMesh(geoms[0], mats[0])
	}
	else if (geoms.length > 1 && mats.length === geoms.length) {
		this.object3d = new THREE.Group()

		for (var i = 0; i < geoms.length; ++i) {
			this.object3d.add(createMesh(geoms[i], mats[i]))
		}
	}
	else if (geoms.length === 1) {
		this.object3d = THREE.SceneUtils.createMultiMaterialObject(geoms[0], mats)
	}
	else {
		console.error('ThreeLoaderScenePlugin: Invalid geometry + material combination', geoms.length, 'geometries', mats.length, 'materials')
	}

	this.emit('loaded', this.object3d)
}

E2.Loaders.SceneLoader = SceneLoader

if (typeof(module) !== 'undefined') {
	module.exports.SceneLoader = SceneLoader
}

})()
