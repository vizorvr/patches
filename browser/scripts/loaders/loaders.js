function Loader() {
	EventEmitter.call(this)
}
Loader.prototype = Object.create(EventEmitter.prototype)

Loader.prototype.errorHandler = function(xhr) {
	this.emit('error', xhr.responseText)
}

Loader.prototype.progressHandler = function(xhr) {
	if (!xhr.total) {
		lengthKnown = false
		return;
	}

	this.emit('progress', xhr.loaded / xhr.total)
}

// ----------------------------------------
function ImageLoader(url) {
	Loader.apply(this, arguments)
	var that = this
	var img = new Image()

	var xhr = new XMLHttpRequest()
	xhr.open('GET', url, true)
	xhr.crossOrigin = 'Anonymous'
	xhr.responseType = 'arraybuffer'

	xhr.onerror = function(err) {
		that.emit('error', err.responseText)
	}

	xhr.onload = function() {
		console.time('Parse image')
		var blob = new Blob([this.response])
		img.src = window.URL.createObjectURL(blob)
		console.timeEnd('Parse image')
		that.onImageLoaded(img)
	}

	xhr.onprogress = function(evt) {
		if (evt.total)
			that.emit('progress', evt.loaded / evt.total)
	}

	xhr.send()
}
ImageLoader.prototype = Object.create(Loader.prototype)
ImageLoader.prototype.onImageLoaded = function(img) {
	that.emit('loaded', img)
}

// ----------------------------------------
function TextureLoader() {
	ImageLoader.apply(this, arguments)
}
TextureLoader.prototype = Object.create(ImageLoader.prototype)
TextureLoader.prototype.onImageLoaded = function(img) {
	var texture = new THREE.Texture()
	texture.wrapS = THREE.RepeatWrapping
	texture.wrapT = THREE.RepeatWrapping
	texture.image = img
	texture.needsUpdate = true

	this.emit('loaded', texture)
}

// ----------------------------------------
function ModelLoader(url) {
	Loader.apply(this, arguments)

	var extname = url.substring(url.lastIndexOf('.'))
	switch(extname) {
		case '.obj':
			this.loadObj(url)
			break;
		case '.js':
		case '.json':
			this.loadJson(url)
			break;
		default:
			msg('ERROR: Don`t know how to load', url, extname)
			break;
	}
}

ModelLoader.prototype = Object.create(Loader.prototype)

ModelLoader.prototype.loadJson = function(url) {
	var loader = new THREE.JSONLoader()
	loader.crossOrigin = 'Anonymous'
	loader.load(url,
		this.onJsonLoaded.bind(this),
		this.progressHandler.bind(this),
		this.errorHandler.bind(this)
	)
}

ModelLoader.prototype.loadObj = function(url) {
	var that = this
	var mtlUrl = url.replace('.obj', '.mtl')

	$.get('/stat' + mtlUrl, function(data) {
		var loader

		if (data.error === undefined) {
			// .mtl exists on server, load .obj and .mtl
			loader = new THREE.OBJMTLLoader()
			loader.crossOrigin = 'Anonymous'
			loader.load(url,
				mtlUrl,
				that.onObjLoaded.bind(that),
				that.progressHandler.bind(that),
				that.errorHandler.bind(that))
		}
		else {
			// no .mtl on server, load .obj only
			loader = new THREE.OBJLoader()
			loader.crossOrigin = 'Anonymous'
			loader.load(url,
				that.onObjLoaded.bind(that),
				that.progressHandler.bind(that),
				that.errorHandler.bind(that))
		}
	})
}
	
ModelLoader.prototype.onObjLoaded = function(geoms, mats) {
	this.emit('loaded', {
		geometries: geoms,
		materials: mats
	})
}
	
ModelLoader.prototype.onJsonLoaded = function(geoms, mats) {
	return this.onObjLoaded([geoms], mats)
}


// ----------------------------------------
function SceneLoader() {
	ModelLoader.apply(this, arguments)
}
SceneLoader.prototype = Object.create(ModelLoader.prototype)

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

if (typeof(module) !== 'undefined') {
	E2.Loaders = {}
	E2.Loaders.ModelLoader = module.exports.ModelLoader = ModelLoader
	E2.Loaders.SceneLoader = module.exports.SceneLoader = SceneLoader
	E2.Loaders.ImageLoader = module.exports.ImageLoader = ImageLoader
	E2.Loaders.TextureLoader = module.exports.TextureLoader = TextureLoader
}

