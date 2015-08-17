(function() {
	var ThreeProceduralGroundPlugin = E2.plugins.three_procedural_ground = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js Procedural Ground'

		this.input_slots = [
			{ name: 'x size', dt: core.datatypes.FLOAT, def: 40 },
			{ name: 'y size', dt: core.datatypes.FLOAT, def: 10 },
			{ name: 'z size', dt: core.datatypes.FLOAT, def: 40 },
			{ name: 'seed', dt: core.datatypes.FLOAT, def: 0},
			{ name: 'noise factor', dt: core.datatypes.FLOAT, def: 0.25},
			{ name: 'noise octaves', dt: core.datatypes.FLOAT, def: 3},
			{ name: 'noise scale', dt: core.datatypes.FLOAT, def: 1.0},
			{ name: 'ground height', dt: core.datatypes.FLOAT, def: 0.0},
			{ name: 'rock height', dt: core.datatypes.FLOAT, def: 3.0}
		].concat(this.input_slots)

		this.output_slots = [{
			name: 'object3d',
			dt: core.datatypes.OBJECT3D
		}]

		this.xSize = 20
		this.ySize = 20
		this.zSize = 20

		this.rngSeed = 10
		this.noiseFactor = 0.25
		this.noiseOctaves = 1.0
		this.noiseScale = 1.0
		this.groundHeight = 0.0
		this.rockHeight = 3.0

		this.dirty = true
	}

	ThreeProceduralGroundPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeProceduralGroundPlugin.prototype.reset = function() {
		if (this.dirty)
			this.generate_mesh()
	}

	ThreeProceduralGroundPlugin.prototype.generate_mesh = function() {
		console.log('generate procedural mesh')

		this.noise = new E2.Noise(2048, this.rngSeed)

		var parent = this

		var GeometryGenerator = function(xSize, ySize, zSize) {
			THREE.Geometry.call(this)
			this.type = 'VizorProceduralGround'

			this.faces = []
			this.vertices = []

			var i, j

			var xSegments = xSize
			var zSegments = zSize

			for (j = 0; j < zSegments + 1; j++) {
				for (i = 0 ; i < xSegments + 1; i++) {
					var vector = new THREE.Vector3()

					// plane coordinates on [-1, 1]-[1, -1]
					var xf = (-0.5 + i * 1.0 / xSegments) * 2.0
					var zf = (0.5 - j * 1.0 / zSegments) * 2.0

					// twist a square plane into a circle
					var f = Math.abs(xf) < Math.abs(zf) ? (1 / Math.abs(zf)) : (1 / Math.abs(xf))
					f = (isNaN(f) || f > 10) ? 10 : f

					var twistFactor = Math.min(Math.max(0, 1 - f / 10), 1)
					var mul = 1 + (Math.sqrt(xf * f * xf * f + zf * f * zf * f) - 1) * twistFactor
					xf /= mul
					zf /= mul

					// y displacement
					var m = Math.abs(xf)
					var n = Math.abs(zf)
					var nm = Math.sqrt(m * m + n * n)

					nm *= nm

					var yf = parent.noise.noise2D(i * parent.noiseScale, j * parent.noiseScale, Math.floor(parent.noiseOctaves), xSegments) * parent.noiseFactor * nm

					// x, z displacement
					var pushOutFactor= 1.0 // + (parent.rng.real(0, 1)) * parent.noiseFactor * m * n
					xf *= pushOutFactor
					yf *= pushOutFactor
					zf *= pushOutFactor

					/*
					// push outmost vertices down for an 'edge' effect
					if (j === 0 || j === zSegments || i === 0 || i === xSegments) {
						yf -= 0.25
					}*/

					vector['x'] = xf * xSize * 0.5
					vector['y'] = yf * ySize * 0.5
					vector['z'] = zf * zSize * 0.5

					this.vertices.push(vector)
				}
			}

			for (j = 0; j < zSegments; j++) {
				for (i = 0; i < xSegments; i++) {
					var vtxidx = j * (xSegments + 1) + i

					var uva = new THREE.Vector2( i / xSegments, 1 - j / zSegments )
					var uvb = new THREE.Vector2( i / xSegments, 1 - ( j + 1 ) / zSegments )
					var uvc = new THREE.Vector2( ( i + 1 ) / xSegments, 1 - ( j + 1 ) / zSegments )
					var uvd = new THREE.Vector2( ( i + 1 ) / xSegments, 1 - j / zSegments )

					var face = new THREE.Face3(vtxidx, vtxidx + 1, vtxidx + (xSegments + 1))

					var getNormal = function(vertices, i, j, aorb) {
						// calculate a normal from one of two triangles (aorb) in a grid
						var idxa = j * (xSegments + 1) + i
						var idxb = j * (xSegments + 1) + i + 1
						var idxc = (j + 1) * (xSegments + 1) + i
						var idxd = (j + 1) * (xSegments + 1) + i + 1

						var a = new THREE.Vector3()
						var b = new THREE.Vector3()

						if (aorb == 0) {
							a.subVectors(vertices[idxb], vertices[idxa])
							b.subVectors(vertices[idxc], vertices[idxa])
						}
						else {
							a.subVectors(vertices[idxb], vertices[idxc])
							b.subVectors(vertices[idxd], vertices[idxc])
						}

						a.normalize()
						b.normalize()

						var normal = new THREE.Vector3()
						normal.crossVectors(a, b)

						return normal
					}

					var getYPos = function(vertices, i, j, aorb) {
						// calculate a normal from one of two triangles (aorb) in a grid
						var idxa = j * (xSegments + 1) + i
						var idxb = j * (xSegments + 1) + i + 1
						var idxc = (j + 1) * (xSegments + 1) + i
						var idxd = (j + 1) * (xSegments + 1) + i + 1

						var res = 0

						if (aorb == 0) {
							res = vertices[idxa]['y'] + vertices[idxb]['y'] + vertices[idxc]['y']
						}
						else {
							res = vertices[idxb]['y'] + vertices[idxc]['y'] + vertices[idxd]['y']
						}

						return res
					}

					var normal = getNormal(this.vertices, i, j, 0.0)
					var ypos = getYPos(this.vertices, i, j, 0.0)
					var materialIndex = ypos < parent.groundHeight ? 2 : (ypos > parent.rockHeight ? 0 : 1)

					face.normal.copy(normal)
					face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone())
					face.materialIndex = materialIndex

					this.faces.push(face)
					this.faceVertexUvs[0].push([uva, uvb, uvc])

					face = new THREE.Face3(vtxidx + (xSegments + 1), vtxidx + 1, vtxidx + (xSegments + 2))

					normal = getNormal(this.vertices, i, j, 1.0)
					ypos = getYPos(this.vertices, i, j, 1.0)
					//materialIndex = ypos < parent.groundHeight ? 2 : (ypos > parent.rockHeight ? 0 : 1)

					face.normal.copy(normal)
					face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone())
					face.materialIndex = materialIndex

					this.faces.push(face)
					this.faceVertexUvs[0].push([uvc, uvb, uvd])
				}
			}

			this.mergeVertices()

			parent.dirty = false
		}

		GeometryGenerator.prototype = Object.create( THREE.Geometry.prototype )
		GeometryGenerator.prototype.constructor = GeometryGenerator


		this.geometry = new GeometryGenerator(this.xSize, this.ySize, this.zSize)
		this.material = new THREE.MeshFaceMaterial([new THREE.MeshLambertMaterial({ color: 0xB29E8C }), new THREE.MeshLambertMaterial({ color: 0xCC6D14 }), new THREE.MeshLambertMaterial({ color: 0x6DB273 })])
		//this.material.wireframe = true
		this.object3d = new THREE.Mesh(this.geometry, this.material)

		// back reference for object picking
		this.object3d.backReference = this
	}

	ThreeProceduralGroundPlugin.prototype.update_input = function(slot, data) {
		switch(slot.index) {
		case 0: // x size
			this.xSize = Math.floor(data)
			this.dirty = true
			break;
		case 1: // y size
			this.ySize = Math.floor(data)
			this.dirty = true
			break;
		case 2: // z size
			this.zSize = Math.floor(data)
			this.dirty = true
			break;
		case 3: // rng seed
			this.rngSeed = data
			this.dirty = true
			break;
		case 4: // noise factor
			this.noiseFactor = data
			this.dirty = true
			break;
		case 5: // noise octaves
			this.noiseOctaves = data
			this.dirty = true
			break;
		case 6: // noise scale
			this.noiseScale = data
			this.dirty = true
			break;
		case 7: // ground height
			this.groundHeight = data
			this.dirty = true
			break;
		case 8: // rock height
			this.rockHeight = data
			this.dirty = true
			break;
		default:
			return ThreeObject3DPlugin.prototype.update_input
			.apply(this, arguments)
		}
	}

	ThreeProceduralGroundPlugin.prototype.state_changed = function(ui)
	{
		if(!ui)
			this.generate_mesh()
	}

	ThreeProceduralGroundPlugin.prototype.update_state = function()
	{
		if (this.dirty)
			this.generate_mesh()
	};


})()

