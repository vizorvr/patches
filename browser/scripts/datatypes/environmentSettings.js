E2.EnvironmentSettings = function() {
	this.fog = new THREE.Fog()

	this.fog.near = 10000
	this.fog.far = 10000
	this.fog.color = new THREE.Color(0x000000)
}