(function() {
	var ThreeLoaderObjPlugin = E2.plugins.three_loader_obj

	var ThreeLoaderObjMtlPlugin = E2.plugins.three_loader_objmtl = function() {
		ThreeLoaderObjPlugin.apply(this, arguments)
	}

	ThreeLoaderObjMtlPlugin.prototype = Object.create(ThreeLoaderObjPlugin.prototype)

	ThreeLoaderObjMtlPlugin.prototype.loadObj = function() {
		var that = this
		THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader())

		console.log('ThreeLoaderObjMtlPlugin loading', this.state.url)

		var mtlUrl = this.state.url.replace('.obj', '.mtl')
		var loader = new THREE.OBJMTLLoader()
		loader.load(this.state.url, mtlUrl, this.onObjLoaded.bind(this),
			function() {
				console.log('Loading progress', that.state.url, arguments)
			}, function(err) {
				msg('ERROR: '+err.toString())
			})
	}

})()

