function deepCopyglTFObject(sourceRoot, targetRoot) {
	function remap(source, target, callback) {
		callback(source, target)

		for (var i = 0; i < source.children.length; ++i) {
			remap(source.children[i], target.children[i], callback)
		}
	}

	// gltf-specific fixup -
	// clone material data but clobber textures as we want to share them
	remap(sourceRoot, targetRoot, function(source, target) {
		if (source.material) {
			target.material = source.material.clone()

			var sourceUniforms = source.material.uniforms
			var targetUniforms = target.material.uniforms
			for(var uniform in sourceUniforms) {
				if(sourceUniforms[uniform].type === 't') {
					targetUniforms[uniform].value = sourceUniforms[uniform].value
				}
			}
		}
	})

	// as we cloned the object above, the shader and animation
	// bindings now point to an incorrect object.
	// Clone the bindings and rebind to the new object.
	THREE.glTFAnimator.cloneAnimationBindings(sourceRoot, targetRoot)
	THREE.glTFShaders.cloneShaderBindings(sourceRoot, targetRoot)
}
