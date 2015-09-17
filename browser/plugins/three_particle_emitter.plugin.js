(function() {
	var ThreeParticleEmitter = E2.plugins.three_particle_emitter = function(core) {
		Plugin.apply(this, arguments)

		this.desc =
			'Particle emitter generating a point cloud that can be' +
			'used in a point cloud'

		this.input_slots = [{
			name: 'particle count',
			dt: core.datatypes.FLOAT,
			def: 100
		}, {
			name: 'spawn rate',
			desc: 'the amount of particles to spawn per second',
			dt: core.datatypes.FLOAT,
			def: 0.1,
			validate: function(v) {return v < 0 ? 0 : (v > 1 ? 1 : v)}
		}, {
			name: 'random seed',
			desc: 'seed to initialise the random number generator with',
			dt: core.datatypes.FLOAT,
			def: 0
		}, {
			name: 'direction',
			dt: core.datatypes.VECTOR,
			def: new THREE.Vector3(0, 1, 0)
		}, {
			name: 'speed',
			desc: 'speed along direction',
			dt: core.datatypes.FLOAT,
			def: 1.0
		}, {
			name: 'spread',
			desc: 'spread around direction',
			dt: core.datatypes.FLOAT,
			def: 1.0
		}, {
			name: 'lifetime',
			desc: 'particle lifetime',
			dt: core.datatypes.FLOAT,
			def: 1.0
		}, {
			name: 'gravity',
			desc: 'gravity vector',
			dt: core.datatypes.VECTOR,
			def: null
		}, {
			name: 'noise',
			desc: 'amount of noise to apply to movement',
			dt: core.datatypes.FLOAT,
			def: 0.5
		}, {
			name: 'geometry',
			desc: 'emit from this geometry',
			dt: core.datatypes.GEOMETRY,
			def: 0
		}]

		this.output_slots = [{
			name: 'geometry',
			dt: core.datatypes.GEOMETRY
		}]

		this.always_update = true
	}

	ThreeParticleEmitter.prototype = Object.create(Plugin.prototype)

	ThreeParticleEmitter.prototype.reset = function() {
		this.buffersDirty = true
		this.positionsDirty = true
		this.particleCount = 100
		this.spawnRate = 0.1

		this.direction = new THREE.Vector3()
		this.velocity = 1
		this.spread = 1
		this.lifetime = 1.0

		this.gravity = null

		this.rngSeed = 0
	}

	ThreeParticleEmitter.prototype.initialiseRandom = function() {
		this.random = new Random(Random.engines.mt19937().seed(this.rngSeed))
	}

	ThreeParticleEmitter.prototype.createBuffers = function() {
		if (!this.random) {
			this.initialiseRandom()
		}

		this.geometry = new THREE.Geometry()

		this.particles = []

		for (var i = 0; i < this.particleCount; ++i) {
			this.geometry.vertices.push(new THREE.Vector3())
			this.particles.push({
				position: new THREE.Vector3(),
				velocity: new THREE.Vector3(),
				lifetime: 0.0
			})
		}

		this.buffersDirty = false
	}

	ThreeParticleEmitter.prototype.updateParticles = function() {
		var particlesToSpawn =
			this.particleCount * this.spawnRate * E2.core.delta_t

		var gravity

		if (this.gravity) {
			gravity = this.gravity.clone()
			gravity.multiplyScalar(E2.core.delta_t)
		}

		for (var i = 0; i < this.particles.length; ++i) {
			var p = this.particles[i]
			if (p.lifetime > 0.0) {
				p.position.add(p.velocity)
				p.lifetime -= E2.core.delta_t
				if (this.gravity) {
					p.velocity.add(gravity)
				}
				if (this.noise > 0) {
					var noiseMin = -E2.core.delta_t * this.noise
					var noiseMax = -noiseMin

					p.velocity.x += this.random.real(noiseMin, noiseMax)
					p.velocity.y += this.random.real(noiseMin, noiseMax)
					p.velocity.z += this.random.real(noiseMin, noiseMax)
				}
			}
			else if (particlesToSpawn >= 0) {
				if (this.vertices) {
					var ranIdx = this.random.uint32() % this.vertices.length
					var vtx = this.vertices[ranIdx]
					p.position.copy(vtx)
				}
				else {
					p.position.set(0, 0, 0)
				}
				p.velocity.set(
					this.random.real(-1,1) * this.spread,
					this.random.real(-1,1) * this.spread,
					this.random.real(-1,1) * this.spread)

				p.velocity.add(this.direction)
				p.velocity.multiplyScalar(
					this.velocity * (1 + this.random.real(-1, 1) * this.noise))

				p.lifetime = this.lifetime

				particlesToSpawn--
			}
			else {
				// temporarily move out of the way
				// not ideal as this will expand the bbox,
				// however looks better than a blob in world origin
				p.position.set(10000, 10000, 10000)
			}

			this.geometry.vertices[i].copy(p.position)
		}

		this.geometry.verticesNeedUpdate = true
		this.geometry.computeBoundingBox()
		this.geometry.computeBoundingSphere()
	}

	ThreeParticleEmitter.prototype.update_input = function(slot, data) {
		if (slot.index === 0) { // particle count
			var newParticleCount = Math.floor(data)
			if (this.particleCount != newParticleCount || !this.particles) {
				this.particleCount = newParticleCount
				this.buffersDirty = true
			}
		}
		else if (slot.index === 1) { // spawn rate
			this.spawnRate = data
		}
		else if (slot.index === 2) { // random seed
			if (this.rngSeed !== data) {
				this.rngSeed = data
				this.initialiseRandom()
			}
		}
		else if (slot.index === 3) { // direction
			this.direction = data
		}
		else if (slot.index === 4) { // speed
			this.velocity = data
		}
		else if (slot.index === 5) { // spread
			this.spread = data
		}
		else if (slot.index === 6) { // lifetime
			this.lifetime = data
		}
		else if (slot.index === 7) { // gravity
			this.gravity = data
		}
		else if (slot.index === 8) { // noise
			this.noise = data
		}
		else if (slot.index === 9) { // geometry
			if (data instanceof THREE.BufferGeometry) {
				var tempGeom = new THREE.Geometry()
				tempGeom.fromBufferGeometry(data)
				this.vertices = tempGeom.vertices
			}
			else if (data instanceof THREE.Geometry) {
				this.vertices = data.vertices
			}
			else // !data
			{
				this.vertices = undefined
			}
		}
	}

	ThreeParticleEmitter.prototype.update_output = function() {
		return this.geometry
	}

	ThreeParticleEmitter.prototype.update_state = function() {
		if (this.buffersDirty) {
			this.createBuffers()
		}

		this.updateParticles()
	}
})()
