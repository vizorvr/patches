(function() {
	var ThreeLoaderScenePlugin = E2.plugins.three_loader_scene = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.core = core

		this.desc = '3D Object/Scene loader. Loads .obj, THREE.js .json, and .glTF object hierarchies.'

		this.urlDirty = true

		// the url this node should be loading
		this.state.url = ''

		// the url we've actually loaded (or are loading)
		this.loadedUrl = ''

		this.input_slots = [].concat(this.input_slots)

		this.defaultObject = new THREE.Object3D(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({color: 0x777777}))
		this.defaultObject.backReference = this

		this.setObject3D(this.defaultObject)

		THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader())

		this.hasAnimation = false

		// a callback to be executed after object has loaded
		// e.g. we want to scale every object to unit size on initial load
		// but not when subsequently (re-)loaded, to not override user defiend
		// scaling
		this.postLoadCallback = undefined
	}

	ThreeLoaderScenePlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeLoaderScenePlugin.prototype.loadObject = function(url) {
		var that = this

		if (url !== this.state.url) {
			this.undoableSetState('url', url, this.state.url)
		}

		this.loadedUrl = url

		this.setObject3D(this.defaultObject)
		this.updated = true

		this.loader = E2.core.assetLoader.loadAsset('scene', url)

		this.loader
		.then(function(asset) {
			that.setObject3D(asset.clone())
			
			deepCopyglTFObject(asset, that.object3d)

			that.postLoadFixUp()
		})
		.finally(function() {
			delete that.loader
		})

		return this.loader
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

					// apply state to object3d (with an empty updateContext, 
					// Object3D doesn't need this for this purpose)
					ThreeObject3DPlugin.prototype.update_state.apply(that, {})

					that.updated = true
				    
					E2.track({
						event: 'assetChanged',
						plugin: 'ThreeLoaderScenePlugin',
						url: newValue
					})

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

		delete this.postLoadCallback
	}

	ThreeLoaderScenePlugin.prototype.postLoadFixUp = function() {
		this.hasAnimation = false
		this.always_update = true

		var that = this

		var removeObjects = []

		this.object3d.traverse(function(n) {
			// filter lights and cameras out of the scene

			if (n instanceof THREE.Light || n instanceof THREE.Camera /*|| (n instanceof THREE.Object3D && (!n instanceof THREE.Bone) && n.children.length === 0 && !n.geometry)*/) {
				removeObjects.push({parent: n.parent, object: n})
			}

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

		this.object3d.backReference = this
	}

	ThreeLoaderScenePlugin.prototype.update_state = function(updateContext) {
		if (this.loadedUrl !== this.state.url) {
			var that = this

			var doLoad = function() {
				that.loadObject(that.state.url).then(function () {
					if (that.postLoadCallback) {
						that.postLoadCallback.execute(that)
					}
					// apply state to object3d
					ThreeObject3DPlugin.prototype.update_state.apply(that, arguments)
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

		ThreeObject3DPlugin.prototype.update_state.apply(this, arguments)

		var delta = updateContext.delta_t * 0.001

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
