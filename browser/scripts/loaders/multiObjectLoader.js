// three.js .json loader wrapping functionality of THREE.JSONLoader, THREE.ObjectLoader and THREE.SceneLoader
// so that one loader can be used to load them all

function MultiObjectLoader(manager) {
	this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager

	this.objectLoader = new THREE.ObjectLoader(manager)
	this.sceneLoader = new THREE.SceneLoader(manager)
	this.jsonLoader = new THREE.JSONLoader(manager)
	if (!window.gltfLoader) {
		window.gltfLoader = new THREE.glTFLoader(true)
	}
	this.gltfLoader = window.gltfLoader//new THREE.glTFLoader(true)
	this.daeLoader = new THREE.ColladaLoader()
	this.fbxLoader = new THREE.FBXLoader(true, manager)

	this.texturePath = ''
}

MultiObjectLoader.prototype = {
	constructor: MultiObjectLoader,

	load: function (url, onGeomsMatsLoaded, onObject3DLoaded, onProgress, onError) {
		var that = this

		if ( this.texturePath === '' ) {
			this.setTexturePath(url.substring( 0, url.lastIndexOf( '/' ) + 1 ))
		}

		if (url.toLowerCase().indexOf('.gltf') !== -1) {
			// gltf
			this.gltfLoader.load(url, function(data) {
				onObject3DLoaded(data)
			})
		}
		else if (url.toLowerCase().indexOf('.dae') !== -1) {
			this.daeLoader.load(url, function(data) {
				onObject3DLoaded(data)
			}, onProgress, onError)
		}
		else if (url.toLowerCase().indexOf('.fbx') !== -1) {
			this.fbxLoader.load(url, function(data) {
				onObject3DLoaded(data)
			}, onProgress, onError)
		}
		else {
			var loader = new THREE.XHRLoader(this.manager)
			//loader.setCrossOrigin(this.crossOrigin)
			loader.load(url, function(text) {
				var json = JSON.parse(text)
				var metadata = json.metadata

				if (metadata && (metadata.type === 'object' || metadata.type === 'Object')) {
					// THREE.ObjectLoader
					that.objectLoader.parse(json, onObject3DLoaded)
				}
				else if (metadata && (metadata.type === 'scene' || metadata.type === 'Scene')) {
					// THREE.SceneLoader
					that.sceneLoader.parse(json, onObject3DLoaded, url)
				}
				else {
					// THREE.JSONLoader
					var object = that.jsonLoader.parse(json, that.jsonLoader.texturePath)
					onGeomsMatsLoaded([object.geometry], object.materials)
				}
			}, onProgress, onError)

		}
	},

	setCrossOrigin: function (value) {
		this.objectLoader.crossOrigin = value
		this.sceneLoader.crossOrigin = value
		this.jsonLoader.crossOrigin = value
		this.gltfLoader.crossOrigin = value
	},

	setTexturePath: function (value) {
		this.texturePath = value

		this.objectLoader.texturePath = value
		this.jsonLoader.texturePath = value

		// this.sceneLoader has no texturePath
	},

	addGeometryHandler: function (typeID, loaderClass) {
		this.sceneLoader.addGeometryHandler(loaderClass)
	},

	addHierarchyHandler: function (typeID, loaderClass) {
		this.sceneLoader.addHierarchyHandler(loaderClass)
	}
}