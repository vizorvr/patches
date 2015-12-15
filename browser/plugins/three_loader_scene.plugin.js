(function() {
	function progress() {
		console.log('Loading progress', this.state.url, arguments)
	}

	function errorHandler(dfd, err) {
		console.error('ERROR: '+err.toString())
		dfd.reject('object failed to load' + err.toString)
	}

	var ThreeLoaderScenePlugin = E2.plugins.three_loader_scene = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.core = core

		this.desc = '3D Object/Scene loader. Loads .obj and THREE.js .json object hierarchies.'

		this.urlDirty = true

		// the url this node should be loading
		this.state.url = ''

		// the url we've actually loaded (or are loading)
		this.loadedUrl = ''

		this.input_slots = [].concat(this.input_slots)

		this.defaultObject = new THREE.Object3D(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({color: 0x777777}))

		THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader())

		this.hasAnimation = false
	}

	ThreeLoaderScenePlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeLoaderScenePlugin.prototype.loadObject = function(url) {
		var dfd = when.defer()

		// store the promise so that sequential loads can be chained together
		// and processed in order
		this.loader = dfd.promise

		if (url !== this.state.url) {
			this.undoableSetState('url', url, this.state.url)
		}
		this.loadedUrl = url

		var that = this

		dfd.promise.finally(function() {
			delete that.loader
		})

		this.object3d = this.defaultObject
		this.updated = true

		if (url.length > 0) {

			var extname = url.substring(url.lastIndexOf('.'))

			switch (extname) {
			case '.js':
			case '.json':
				this.loadJson(dfd, url)
				break
			case '.obj':
				this.loadObj(dfd, url)
				break
			default:
				msg('ERROR: SceneLoader: Don`t know how to load', extname)
				break;
			}
		}
		else {
			msg('ERROR: SceneLoader: Invalid Url', extname)
			dfd.reject('invalid url')
		}

		return dfd.promise
	}

	ThreeLoaderScenePlugin.prototype.create_ui = function() {
		var inp = makeButton('Change', 'No model selected.', 'url')
		var that = this

		inp.click(function() {
			var oldValue = that.state.url
			var newValue

			FileSelectControl
			.createSceneSelector(that.state.url)
			.onChange(function(v) {
				newValue = v
			})
			.on('closed', function() {
				if (newValue === oldValue || newValue.length === 0)
					return

				E2.app.undoManager.begin('Load Object')

 				that.loadObject(newValue).then(function() {
					that.scaleToUnitSize()

					// apply state to object3d
					that.update_state()

					that.updated = true
				    
				    E2.app.undoManager.end()
			    })
			})
		})

		return inp
	}

	ThreeLoaderScenePlugin.prototype.scaleToUnitSize = function() {
		var bbox = new THREE.Box3()

		this.object3d.traverse(function (n) {
			if (n.geometry) {
				n.geometry.computeBoundingBox()
				var bb = n.geometry.boundingBox
				bbox.expandByPoint(n.geometry.boundingBox.min)
				bbox.expandByPoint(n.geometry.boundingBox.max)
			}
		})

		var xLen = bbox.max.x - bbox.min.x
		var yLen = bbox.max.y - bbox.min.y
		var zLen = bbox.max.z - bbox.min.z

		var scaleFactor = 1

		if (xLen > 0 && xLen > yLen && xLen > zLen) {
			// x longest
			scaleFactor /= xLen
		}
		else if (yLen > 0 && yLen > xLen && yLen > zLen) {
			// y longest
			scaleFactor /= yLen
		}
		else if (zLen > 0 && zLen > xLen && zLen > yLen) {
			// z longest
			scaleFactor /= zLen
		}
		// if none of the above match, there is no valid bounding volume (empty / corrupt model?)

		this.undoableSetState('scale', new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor), new THREE.Vector3(this.state.scale.x, this.state.scale.y, this.state.scale.z))
	}

	ThreeLoaderScenePlugin.prototype.postLoadFixUp = function() {
		this.hasAnimation = false
		this.always_update = true

		var that = this

		var removeObjects = []

		this.object3d.traverse(function(n) {
			// filter lights and cameras out of the scene

			if (n instanceof THREE.Light || n instanceof THREE.Camera) {
				removeObjects.push({parent: n.parent, object: n})
			}

			n.backReference = that

			var geom = n.geometry

			if (geom) {
				var bufferGeometryHasVtxNormals =
						geom instanceof THREE.BufferGeometry &&
						geom.getAttribute('normal') !== undefined

				var normalGeometryHasFaceNormals =
						(geom.faces && geom.faces.length > 0 &&
						geom.faces[0].normal.lengthSq() !== 0)

				var normalGeometryHasVtxNormals =
						(geom.faces && geom.faces.length > 0 &&
						geom.faces[0].vertexNormals.length > 0)

				if (!bufferGeometryHasVtxNormals && !normalGeometryHasFaceNormals && !normalGeometryHasVtxNormals) {
					geom.computeVertexNormals(true)
				}

				if (geom.animations && geom.animations.length > 0) {
					n.playAnimation(geom.animations[0].name, 100)
					n.material.morphTargets = true
					that.hasAnimation = true
					that.always_update = true
				}
			}
		})

		for (var i = 0; i < removeObjects.length; ++i) {
			removeObjects[i].parent.remove(removeObjects[i].object)
		}
	}

	ThreeLoaderScenePlugin.prototype.onGeomsMatsLoaded = function(dfd, geoms, mats) {
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

		this.postLoadFixUp()

		dfd.resolve()
	}

	ThreeLoaderScenePlugin.prototype.onHierarchyLoaded = function(dfd, scene) {
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

		this.postLoadFixUp()

		dfd.resolve()
	}

	ThreeLoaderScenePlugin.prototype.loadJson = function(dfd, url) {
		var loader = new MultiObjectLoader()

		loader.load(
				url,
				this.onGeomsMatsLoaded.bind(this, dfd),
				this.onHierarchyLoaded.bind(this, dfd),
				progress.bind(this),
				errorHandler.bind(this, dfd))
	}

	ThreeLoaderScenePlugin.prototype.loadObj = function(dfd, url) {
		var mtlUrl = url.replace('.obj', '.mtl')

		var that = this

		$.get('/stat' + mtlUrl, function(data) {
			if (data.error === undefined) {
				// .mtl exists on server, load .obj and .mtl
				new THREE.OBJMTLLoader()
						.load(url, mtlUrl, that.onGeomsMatsLoaded.bind(that, dfd), progress.bind(that), errorHandler.bind(that, dfd))
			}
			else {
				// no .mtl on server, load .obj only
				new THREE.OBJLoader()
						.load(url, that.onGeomsMatsLoaded.bind(that, dfd), progress.bind(that), errorHandler.bind(that, dfd))
			}
		})
	}

	ThreeLoaderScenePlugin.prototype.state_changed = function(ui) {
		if (!ui) {
		}
	}

	ThreeLoaderScenePlugin.prototype.update_state = function() {
		if (this.loadedUrl !== this.state.url) {
			var that = this

			var doLoad = function() {
				that.loadObject(that.state.url).then(function () {
					// apply state to object3d
					that.update_state()
					that.updated = true
				})
			}

			if (this.loader) {
				// chain to an existing loader, ensuring order
				this.loader.then(doLoad)
			}
			else {
				// load straight away
				doLoad()
			}

		}

		ThreeObject3DPlugin.prototype.update_state.apply(this)

		var delta = this.core.delta_t * 0.001

		if (this.object3d && this.hasAnimation) {
			this.object3d.traverse(function(n) {
				if (n instanceof THREE.MorphAnimMesh) {
					n.updateAnimation(delta)
				}
			})
		}
	}

	ThreeLoaderScenePlugin.prototype.update_output = function(slot) {
		if (slot.index === 0) {
			return this.object3d
		}
	}

})()
