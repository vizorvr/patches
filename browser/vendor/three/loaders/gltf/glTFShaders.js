/**
 * @author Tony Parisi / http://www.tonyparisi.com/
 */

THREE.glTFShaders = ( function () {

	var shaders = [];

	return	{
		add : function(shader) {
			shaders.push(shader);
		},

		remove: function(shader) {

			var i = shaders.indexOf(shader);

			if ( i !== -1 ) {
				shaders.splice( i, 1 );
			}
		},

		removeAll: function(shader) {

			// probably want to clean up the shaders, too, but not for now
			shaders = [];
		},

		bindShaderParameters: function(scene) {
			for (var i = 0; i < shaders.length; i++)
			{
				shaders[i].bindParameters(scene);
			}
		},

		update : function(scene, camera) {
			for (var i = 0; i < shaders.length; i++)
			{
				shaders[i].update(scene, camera);
			}
		},

		cloneShaderBindings : function(source, target) {
			var newShaders = []
			for (var i = 0; i < shaders.length; i++)
			{
				var cloneIdx = -1
				var idx = 0
				
				// find the matching object (if any) from source object hierarchy
				source.traverse(function(n) {
					if (cloneIdx === -1 && n === shaders[i].object) {
						cloneIdx = idx
					}
					++idx
				})

				if (cloneIdx >= 0) {
					idx = 0
					var targetChild = undefined

					// find the matching object from target object hierarchy
					target.traverse(function(n) {
						if (cloneIdx === idx) {
							targetChild = n
						}
						++idx
					})
					if (targetChild) {
						var newShader = shaders[i].clone(targetChild, source, target)
						newShader.bindParameters(target)
						newShaders.push(newShader)
					}
				}
			}

			for (var i = 0; i < newShaders.length; i++) {
				this.add(newShaders[i])
			}
		}
	};
})();

// Construction/initialization
THREE.glTFShader = function(material, params, object, scene) {
	this.material = material;
	this.materialParams = params
	this.parameters = params.technique.parameters;
	this.uniforms = params.technique.uniforms;
	this.object = object;
	this.semantics = {};
	this.m4 = new THREE.Matrix4;
}

THREE.glTFShader.prototype.clone = function(object, sourceTree, targetTree) {
	var newParams = {
		technique: {
			parameters: this.parameters,
			uniforms: this.uniforms
		}
	}
	
	function remap(source, target, f) {
		f(source, target)

		for (var i = 0; i < source.children.length; ++i) {
			remap(source.children[i], target.children[i], f)
		}
	}

	return new THREE.glTFShader(object.material, newParams, object)
}


// bindParameters - connect the uniform values to their source parameters
THREE.glTFShader.prototype.bindParameters = function(scene) {

	function findObject(o, p) { 
		if (o.glTFID == param.node) {
			p.sourceObject = o;
		}
	}

	for (var uniform in this.uniforms) {
		var pname = this.uniforms[uniform];
		var param = this.parameters[pname];
		if (param.semantic) {

			var p = { 
				semantic : param.semantic,
				uniform: this.material.uniforms[uniform] 
			};

			if (param.node) {
				scene.traverse(function(o) { findObject(o, p)});
			}
			else {
				p.sourceObject = this.object;
			}

			if (!p.sourceObject) {
				continue
			}

			this.semantics[pname] = p;

		}
	}

}

// Update - update all the uniform values
THREE.glTFShader.prototype.update = function(scene, camera) {

	// update scene graph
	scene.updateMatrixWorld();

	// update camera matrices and frustum
	camera.updateMatrixWorld();
	camera.matrixWorldInverse.getInverse( camera.matrixWorld );


	for (var sname in this.semantics) {
		var semantic = this.semantics[sname];

		if (semantic) {
	        switch (semantic.semantic) {
	            case "MODELVIEW" :
	                if (semantic.sourceObject) {
		                var m4 = semantic.uniform.value;
		                m4.multiplyMatrices(camera.matrixWorldInverse,
		                	semantic.sourceObject.matrixWorld);
	                }
	                break;

	            case "MODELVIEWINVERSETRANSPOSE" :
		            if (semantic.sourceObject) {
			            var m3 = semantic.uniform.value;
			            this.m4.multiplyMatrices(camera.matrixWorldInverse,
			            	semantic.sourceObject.matrixWorld);
			            m3.getNormalMatrix(this.m4);
		            }
	                break;

	            case "PROJECTION" :
	            	var m4 = semantic.uniform.value;
	            	m4.copy(camera.projectionMatrix);            		
	                break;

	            case "JOINTMATRIX" :
		            if (semantic.sourceObject) {
			            var m4v = semantic.uniform.value;
			            for (var mi = 0; mi < m4v.length; mi++) {
				            // So it goes like this:
				            // SkinnedMesh world matrix is already baked into MODELVIEW;
				            // transform joints to local space,
				            // then transform using joint's inverse
							m4v[mi].getInverse(semantic.sourceObject.matrixWorld).
								multiply(this.object.skeleton.bones[mi].matrixWorld).
								multiply(this.object.skeleton.boneInverses[mi]);
			            }
		            }
	                //console.log("Joint:", semantic)
	                break;

	            default :
	                throw new Error("Unhandled shader semantic" + semantic);
	                break;
	        }
        }
	}
}
