(function() {
	var Noise = E2.Noise = function(size, rngSeed) {
		this.seed(size || 256, rngSeed || 0)
	}

	Noise.prototype.seed = function(size, rngSeed) {
		this.size = Math.floor(size)
		this.rngSeed = rngSeed

		this.rng = new Random(Random.engines.mt19937().seed(this.rngSeed))

		this.rns = []

		for (var i = 0; i < size; i++) {
			this.rns[i] = this.rng.real(0, 1)
		}
	}

	Noise.prototype.noise1D = function(n, level) {
		var x = this.rns[Math.floor(n % this.size)]
		var xplus1 = this.rns[Math.floor((n + 1) % this.size)]

		var f = n - Math.floor(n)
		var smoothstep = f * f * (3 - 2 * f)

		var res = x + (xplus1 - x) * smoothstep

		if (level > 0) {
			res = res * 0.5 + this.noise1D((n + this.size / (level + 1)) / 2, level - 1)
		}

		return res
	}

	Noise.prototype.noise2D = function(n, m, level, stride) {
		var xstride = stride || 40

		var mi = Math.floor(m)
		var ni = Math.floor(n)

		var x1 = this.rns[(mi * xstride + ni) % this.size]
		var x1plus1 = this.rns[((mi * xstride + ni) + 1) % this.size]

		var x2 = this.rns[((mi * xstride + ni) + xstride) % this.size]
		var x2plus1 = this.rns[(((mi * xstride + ni) + xstride) + 1) % this.size]

		var xf = n - ni
		var xsmoothstep = xf * xf * (3 - 2 * xf)

		var yf = m - mi
		var ysmoothstep = yf * yf * (3 - 2 * yf)

		var x1val = x1 + (x1plus1 - x1) * xsmoothstep
		var x2val = x2 + (x2plus1 - x2) * xsmoothstep

		var res = x1val + (x2val - x1val) * ysmoothstep

		if (level > 0) {
			res = res * 0.5 + this.noise2D((n + this.size / (level + 1)) / 2, (m + this.size / (level + 1)) / 2, level - 1, xstride)
		}

		return res
	}
})()