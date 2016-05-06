/**
 * @author Tony Parisi / http://www.tonyparisi.com/
 */

// context in which a single load operation operates
THREE.glTFLoadContext = function(url, rootObj, onLoadedCallback) {
	this.url = url
	this.meshesRequested = 0;
	this.meshesLoaded = 0;
	this.pendingMeshes = [];
	this.animationsRequested = 0;
	this.animationsLoaded = 0;
	this.animations = [];
	this.shadersRequested = 0;
	this.shadersLoaded = 0;
	this.shaders = {};
	this.loadRequests = [];

	this.rootObj = rootObj
	this.onLoadedCallback = onLoadedCallback

	this.onSceneLoadedCallback = function(obj) {

	}

	var that = this

	function componentsPerElementForGLType(type) {
		var nElements = 1
		
		switch(type) {
		case "SCALAR" :
			nElements = 1;
			break;
		case "VEC2" :
			nElements = 2;
			break;
		case "VEC3" :
			nElements = 3;
			break;
		case "VEC4" :
			nElements = 4;
			break;
		case "MAT2" :
			nElements = 4;
			break;
		case "MAT3" :
			nElements = 9;
			break;
		case "MAT4" :
			nElements = 16;
			break;
		default :
			debugger;
			break;
		}

		return nElements;
	}

	// Delegate for processing index buffers
	var IndicesDelegate = function() {};

	IndicesDelegate.prototype.handleError = function(errorCode, info) {
		// FIXME: report error
		console.log("ERROR(IndicesDelegate):"+errorCode+":"+info);
	};

	IndicesDelegate.prototype.convert = function(resource, ctx) {
		return new Uint16Array(resource, 0, ctx.indices.count);
	};

	IndicesDelegate.prototype.resourceAvailable = function(glResource, ctx) {
		var geometry = ctx.geometry;
		geometry.indexArray = glResource;
		geometry.checkFinished();
		return true;
	};

	this.indicesDelegate = new IndicesDelegate();

	// Delegate for processing vertex attribute buffers
	var VertexAttributeDelegate = function() {};

	VertexAttributeDelegate.prototype.handleError = function(errorCode, info) {
		// FIXME: report error
		console.log("ERROR(VertexAttributeDelegate):"+errorCode+":"+info);
	};

	VertexAttributeDelegate.prototype.convert = function(resource, ctx) {
		return resource;
	};


	VertexAttributeDelegate.prototype.bufferResourceAvailable = function(glResource, ctx) {
		var geom = ctx.geometry;
		var attribute = ctx.attribute;
		var semantic = ctx.semantic;
		var floatArray;
		var i, l;
		var nComponents;
		//FIXME: Float32 is assumed here, but should be checked.

		if (semantic == "POSITION") {
			// TODO: Should be easy to take strides into account here
			floatArray = new Float32Array(glResource, 0, attribute.count * componentsPerElementForGLType(attribute.type));
			geom.geometry.addAttribute( 'position', new THREE.BufferAttribute( floatArray, 3 ) );
		} else if (semantic == "NORMAL") {
			nComponents = componentsPerElementForGLType(attribute.type);
			floatArray = new Float32Array(glResource, 0, attribute.count * nComponents);
			geom.geometry.addAttribute( 'normal', new THREE.BufferAttribute( floatArray, 3 ) );
		} else if ((semantic == "TEXCOORD_0") || (semantic == "TEXCOORD" )) {

			nComponents = componentsPerElementForGLType(attribute.type);
			floatArray = new Float32Array(glResource, 0, attribute.count * nComponents);
			// N.B.: flip Y value... should we just set texture.flipY everywhere?
			for (i = 0; i < floatArray.length / 2; i++) {
				floatArray[i*2+1] = 1.0 - floatArray[i*2+1];
			}
			geom.geometry.addAttribute( 'uv', new THREE.BufferAttribute( floatArray, nComponents ) );
		}
		else if (semantic == "WEIGHT") {
			nComponents = componentsPerElementForGLType(attribute.type);
			floatArray = new Float32Array(glResource, 0, attribute.count * nComponents);
			geom.geometry.addAttribute( 'skinWeight', new THREE.BufferAttribute( floatArray, nComponents ) );
		}
		else if (semantic == "JOINT") {
			nComponents = componentsPerElementForGLType(attribute.type);
			floatArray = new Float32Array(glResource, 0, attribute.count * nComponents);
			geom.geometry.addAttribute( 'skinIndex', new THREE.BufferAttribute( floatArray, nComponents ) );
		}
	}

	VertexAttributeDelegate.prototype.resourceAvailable = function(glResource, ctx) {

		this.bufferResourceAvailable(glResource, ctx);

		var geom = ctx.geometry;
		geom.loadedAttributes++;
		geom.checkFinished();
		return true;
	};

	this.vertexAttributeDelegate = new VertexAttributeDelegate();


	// Delegate for processing shaders from external files
	var ShaderDelegate = function() {
	};

	ShaderDelegate.prototype.handleError = function(errorCode, info) {
		// FIXME: report error
		console.log("ERROR(ShaderDelegate):"+errorCode+":"+info);
	};

	ShaderDelegate.prototype.convert = function(resource, ctx) {
		return resource;
	}

	ShaderDelegate.prototype.resourceAvailable = function(data, ctx) {
		that.shadersLoaded++;
		that.shaders[ctx.id] = data;
		return true;
	};

	this.shaderDelegate = new ShaderDelegate();

	// Delegate for processing animation parameter buffers
	var AnimationParameterDelegate = function() {};

	AnimationParameterDelegate.prototype.handleError = function(errorCode, info) {
		// FIXME: report error
		console.log("ERROR(AnimationParameterDelegate):"+errorCode+":"+info);
	};

	AnimationParameterDelegate.prototype.convert = function(resource, ctx) {
		var parameter = ctx.parameter;

		var glResource = null;
		switch (parameter.type) {
		case "SCALAR" :
		case "VEC2" :
		case "VEC3" :
		case "VEC4" :
			glResource = new Float32Array(resource, 0, parameter.count * componentsPerElementForGLType(parameter.type));
			break;
		default:
			break;
		}

		return glResource;
	};

	AnimationParameterDelegate.prototype.resourceAvailable = function(glResource, ctx) {
		var animation = ctx.animation;
		var parameter = ctx.parameter;
		parameter.data = glResource;
		animation.handleParameterLoaded(parameter);
		return true;
	};

	this.animationParameterDelegate = new AnimationParameterDelegate();

	// Delegate for processing inverse bind matrices buffer
	var InverseBindMatricesDelegate = function() {};

	InverseBindMatricesDelegate.prototype.handleError = function(errorCode, info) {
		// FIXME: report error
		console.log("ERROR(InverseBindMatricesDelegate):"+errorCode+":"+info);
	};

	InverseBindMatricesDelegate.prototype.convert = function(resource, ctx) {
		var parameter = ctx.parameter;

		var glResource = null;
		switch (parameter.type) {
		case "MAT4" :
			glResource = new Float32Array(resource, 0, parameter.count * componentsPerElementForGLType(parameter.type));
			break;
		default:
			break;
		}

		return glResource;
	};

	InverseBindMatricesDelegate.prototype.resourceAvailable = function(glResource, ctx) {
		var skin = ctx.skin;
		skin.inverseBindMatrices = glResource;
		return true;
	};

	this.inverseBindMatricesDelegate = new InverseBindMatricesDelegate();
}

THREE.glTFLoadContext.prototype.scheduleLoad = function(loadFn, data) {

	this.loadRequests.push({fn: loadFn, data:data});
}

THREE.glTFLoadContext.prototype.loadAllAssets = function() {

	for (var i = 0, len = this.loadRequests.length; i < len; i++) {
		var request = this.loadRequests[i];
		request.fn(request.data);
	}
	this.loadRequests = []
}

THREE.glTFLoadContext.prototype.callLoadedCallback = function(loader) {
	var result = {
		scene : this.rootObj,
		cameras : loader.cameras,
		animations : loader.animations,
		shaders : loader.shaders,
	};

	this.onLoadedCallback(result);
}

THREE.glTFLoadContext.prototype.checkComplete = function(loader) {
	if (this.meshesLoaded == this.meshesRequested
	&& this.shadersLoaded == this.shadersRequested
	&& this.animationsLoaded == this.animationsRequested)
	{
		console.log('glTF loading complete:', this.url, 'meshes:', this.meshesLoaded, 'shaders:', this.shadersLoaded, 'animations', this.animationsLoaded)
		for (var i = 0; i < this.pendingMeshes.length; i++) {
			var pending = this.pendingMeshes[i];
			pending.mesh.attachToNode(this, pending.node);
		}

		for (var i = 0; i < this.animations.length; i++) {
			var animation = this.animations[i];
			loader.buildAnimation(animation, this.rootObj);
		}

		loader.createMeshAnimations(this.rootObj);
		loader.bindAnimations(this.rootObj)
		loader.createAnimations();
		THREE.glTFShaders.bindShaderParameters(this.rootObj);

		this.callLoadedCallback(loader);
	}
}

THREE.glTFLoaderDebug = {
	debugPendingMeshes: 0
}

// glTF loader
THREE.glTFLoader = function (showStatus) {
	//THREE.GLTFLoaderUtils.init();
	THREE.glTFShaders.removeAll();
	THREE.Loader.call( this, showStatus );
}

THREE.glTFLoader.prototype = new THREE.Loader();
THREE.glTFLoader.prototype.constructor = THREE.glTFLoader;

THREE.glTFLoader.prototype.load = function( url, callback ) {
	// Utilities

	function RgbArraytoHex(colorArray) {
		if(!colorArray) return 0xFFFFFFFF;
		var r = Math.floor(colorArray[0] * 255),
			g = Math.floor(colorArray[1] * 255),
			b = Math.floor(colorArray[2] * 255),
			a = 255;

		var color = (a << 24) + (r << 16) + (g << 8) + b;

		return color;
	}

	function replaceShaderDefinitions(shader, material) {

		// Three.js seems too dependent on attribute names so globally
		// replace those in the shader code
		var program = material.params.program;
		var shaderParams = material.params.technique.parameters;
		var shaderAttributes = material.params.technique.attributes;
		var params = {};

		for (var attribute in material.params.attributes) {
			var pname = shaderAttributes[attribute];
			var shaderParam = shaderParams[pname];
			var semantic = shaderParam.semantic;
			if (semantic) {
				params[attribute] = shaderParam;
			}
		}


		var s = shader;
		var r = "";
		for (var pname in params) {
			var param = params[pname];
			var semantic = param.semantic;

			r = eval("/" + pname + "/g");
			
			switch (semantic) {
				case "POSITION" :
					s = s.replace(r, 'position');
					break;
				case "NORMAL" :
					s = s.replace(r, 'normal');
					break;
				case "TEXCOORD_0" :
					s = s.replace(r, 'uv');
					break;
			   case "WEIGHT" :
					s = s.replace(r, 'skinWeight');
					break;
				case "JOINT" :
					s = s.replace(r, 'skinIndex');
					break;
				default :
					break;
			}

		}

		return s;
	}

	function replaceShaderSemantics(loadContext, material) {
		
		var vertexShader = loadContext.shaders[material.params.vertexShader];
		if (vertexShader) {
			vertexShader = replaceShaderDefinitions(vertexShader, material);
			loadContext.shaders[material.params.vertexShader] = vertexShader;
		}

	}

	function createShaderMaterial(loadContext, material) {
		
		// replace named attributes and uniforms with Three.js built-ins    
		replaceShaderSemantics(loadContext, material);

		var fragmentShader = loadContext.shaders[material.params.fragmentShader];
		if (!fragmentShader) {
			debugger
			console.log("ERROR: Missing fragment shader definition:", material.params.fragmentShader);
			return new THREE.MeshPhongMaterial;
		}
		
		var vertexShader = loadContext.shaders[material.params.vertexShader];
		if (!vertexShader) {
			debugger
			console.log("ERROR: Missing vertex shader definition:", material.params.vertexShader);
			return new THREE.MeshPhongMaterial;
		}

		// clone most uniforms but then clobber textures, we want them to 
		// be reused
		var uniforms = THREE.UniformsUtils.clone(material.params.uniforms);
		for (uniform in material.params.uniforms) {
			var src = material.params.uniforms[uniform];
			var dst = uniforms[uniform];
			if (dst.type == "t") {
				dst.value = src.value;
			}            
		}

		var shaderMaterial = new THREE.RawShaderMaterial( {

			fragmentShader: fragmentShader,
			vertexShader: vertexShader,
			uniforms: uniforms,
			transparent: material.params.transparent,

		} );

//        console.log("New shader material")
		return shaderMaterial;
	}


	function LoadTexture(src) {
		if(!src) { return null; }

		var isDataUriRegex = /^data:/;

		var loadImage = function(url, success, error) {
			var image = new Image();

			image.onload = function() {
				success(image);
			};

			if (typeof error !== 'undefined') {
				image.onerror = error;
			}

			image.src = url;
		};

		function loadImageFromTypedArray(uint8Array, format) {
			//>>includeStart('debug', pragmas.debug);
			if (!defined(uint8Array)) {
				throw new DeveloperError('uint8Array is required.');
			}

			if (!defined(format)) {
				throw new DeveloperError('format is required.');
			}
			//>>includeEnd('debug');

			var blob = new Blob([uint8Array], {
				type : format
			});

		};     

		function decodeDataUriText(isBase64, data) {
			var result = decodeURIComponent(data);
			if (isBase64) {
				return atob(result);
			}
			return result;
		}

		function decodeDataUriArrayBuffer(isBase64, data) {
			var byteString = decodeDataUriText(isBase64, data);
			var buffer = new ArrayBuffer(byteString.length);
			var view = new Uint8Array(buffer);
			for (var i = 0; i < byteString.length; i++) {
				view[i] = byteString.charCodeAt(i);
			}
			return buffer;
		}

		function decodeDataUri(dataUriRegexResult, responseType) {
			responseType = typeof responseType !== 'undefined' ? responseType : '';
			var mimeType = dataUriRegexResult[1];
			var isBase64 = !!dataUriRegexResult[2];
			var data = dataUriRegexResult[3];

			switch (responseType) {
			case '':
			case 'text':
				return decodeDataUriText(isBase64, data);
			case 'ArrayBuffer':
				return decodeDataUriArrayBuffer(isBase64, data);
			case 'blob':
				var buffer = decodeDataUriArrayBuffer(isBase64, data);
				return new Blob([buffer], {
					type : mimeType
				});
			case 'document':
				var parser = new DOMParser();
				return parser.parseFromString(decodeDataUriText(isBase64, data), mimeType);
			case 'json':
				return JSON.parse(decodeDataUriText(isBase64, data));
			default:
				throw 'Unhandled responseType: ' + responseType;
			}
		}

		var dataUriRegex = /^data:(.*?)(;base64)?,(.*)$/;
		var dataUriRegexResult = dataUriRegex.exec(src);
		if (dataUriRegexResult !== null) {
			var texture = new THREE.Texture;
			var blob = decodeDataUri(dataUriRegexResult, 'blob');
			var blobUrl = window.URL.createObjectURL(blob);
			loadImage(blobUrl, function(img) {
				texture.image = img;
				texture.needsUpdate = true;
			});
			return texture;
		}
   
		return new THREE.TextureLoader().load(src);
	}

	function CreateTexture(resources, resource) {
		var texturePath = null;
		var textureParams = null;

		if (resource)
		{
			var texture = resource;
			if (texture) {
				var textureEntry = resources.getEntry(texture);
				if (textureEntry) {
					{
						var imageEntry = resources.getEntry(textureEntry.description.source);
						if (imageEntry) {
							texturePath = imageEntry.description.uri;
						}
						
						var samplerEntry = resources.getEntry(textureEntry.description.sampler);
						if (samplerEntry) {
							textureParams = samplerEntry.description;
						}
					}
				}
			}                    
		}

		var texture = LoadTexture(texturePath);
		if (texture && textureParams) {
			
			if (textureParams.wrapS == WebGLRenderingContext.REPEAT)
				texture.wrapS = THREE.RepeatWrapping;

			if (textureParams.wrapT == WebGLRenderingContext.REPEAT)
				texture.wrapT = THREE.RepeatWrapping;
			
			if (textureParams.magFilter == WebGLRenderingContext.LINEAR)
				texture.magFilter = THREE.LinearFilter;

//                  if (textureParams.minFilter == "LINEAR")
//                      texture.minFilter = THREE.LinearFilter;
		}

		return texture;
	}

	// Geometry processing

	var ClassicGeometry = function() {

		this.geometry = new THREE.BufferGeometry;
		this.totalAttributes = 0;
		this.loadedAttributes = 0;
		this.indicesLoaded = false;
		this.finished = false;

		this.onload = null;

		this.uvs = null;
		this.indexArray = null;
	};

	ClassicGeometry.prototype.constructor = ClassicGeometry;

	ClassicGeometry.prototype.buildBufferGeometry = function() {
		// Build indexed mesh
		var geometry = this.geometry;
		geometry.setIndex(new THREE.BufferAttribute( this.indexArray, 1 ) );

		var offset = {
				start: 0,
				index: 0,
				count: this.indexArray.length
			};

		geometry.groups.push( offset );

		geometry.computeBoundingSphere();
	}
	
	ClassicGeometry.prototype.checkFinished = function() {
		if(this.indexArray && this.loadedAttributes === this.totalAttributes) {
			
			this.buildBufferGeometry();
			
			this.finished = true;

			if(this.onload) {
				this.onload();
			}
		}
	};

	var IndicesContext = function(indices, geometry) {
		this.indices = indices;
		this.geometry = geometry;
	};
	
	var VertexAttributeContext = function(attribute, semantic, geometry) {
		this.attribute = attribute;
		this.semantic = semantic;
		this.geometry = geometry;
	};

	var Mesh = function() {
		++THREE.glTFLoaderDebug.debugPendingMeshes
		this.primitives = [];
		this.materialsPending = [];
		this.loadedGeometry = 0;
		this.onCompleteCallbacks = [];
	};

	Mesh.prototype.addPrimitive = function(geometry, material) {
		
		var self = this;
		geometry.onload = function() {
			self.loadedGeometry++;
			self.checkComplete();
		};
		
		this.primitives.push({
			geometry: geometry,
			material: material,
			mesh: null
		});
	};

	Mesh.prototype.onComplete = function(callback) {
		this.onCompleteCallbacks.push(callback);
		//this.checkComplete();
	};

	Mesh.prototype.checkComplete = function() {
		var self = this;
		if(this.onCompleteCallbacks.length && this.primitives.length == this.loadedGeometry) {
			this.onCompleteCallbacks.forEach(function(callback) {
				callback(self);
			});
			this.onCompleteCallbacks = [];
			--THREE.glTFLoaderDebug.debugPendingMeshes
			console.log('Meshes waiting', THREE.glTFLoaderDebug.debugPendingMeshes)
		}
	};

	Mesh.prototype.attachToNode = function(loadContext, threeNode) {
		// Assumes that the geometry is complete
		var that = this;
		this.primitives.forEach(function(primitive) {
			/*if(!primitive.mesh) {
				primitive.mesh = new THREE.Mesh(primitive.geometry, primitive.material);
			}*/
			var material = primitive.material;
			var materialParams = material.params;
			if (!(material instanceof THREE.Material)) {
				material = createShaderMaterial(loadContext, material);
			}

			if (!that.skin) {
				// console.log ("New mesh")
				var threeMesh = new THREE.Mesh(primitive.geometry.geometry, material);
				threeMesh.castShadow = true;
				threeNode.add(threeMesh);

				if (material instanceof THREE.ShaderMaterial) {
					var glTFShader = new THREE.glTFShader(material, materialParams, threeMesh, loadContext.rootObj);
					THREE.glTFShaders.add(glTFShader);

				}                
			}
		});
	};

	// Delayed-loaded material
	var Material = function(params) {
		this.params = params;
	};
	
	var AnimationParameterContext = function(parameter, animation) {
		this.parameter = parameter;
		this.animation = animation;
	};

	// Animations
	var Animation = function() {

		// create Three.js keyframe here
		this.totalParameters = 0;
		this.loadedParameters = 0;
		this.parameters = {};
		this.finishedLoading = false;
		this.onload = null;

	};

	Animation.prototype.constructor = Animation;

	Animation.prototype.handleParameterLoaded = function(parameter) {
		this.parameters[parameter.name] = parameter;
		this.loadedParameters++;
		this.checkFinished();
	};
	
	Animation.prototype.checkFinished = function() {
		if(this.loadedParameters === this.totalParameters) {
			// Build animation
			this.finishedLoading = true;

			if (this.onload) {
				this.onload();
			}
		}
	};
	
	var InverseBindMatricesContext = function(param, skin) {
		this.parameter = param;
		this.skin = skin;
	};

	var ShaderContext = function(id, path) {
		this.id = id;
		this.uri = path;
	};
	
	// Resource management

	var ResourceEntry = function(entryID, object, description) {
		this.entryID = entryID;
		this.object = object;
		this.description = description;
	};

	var Resources = function() {
		this._entries = {};
	};

	Resources.prototype.setEntry = function(entryID, object, description) {
		if (!entryID) {
			console.error("No EntryID provided, cannot store", description);
			return;
		}

		if (this._entries[entryID]) {
			console.warn("entry["+entryID+"] is being overwritten");
		}
	
		this._entries[entryID] = new ResourceEntry(entryID, object, description );
	};
	
	Resources.prototype.getEntry = function(entryID) {
		return this._entries[entryID];
	};

	Resources.prototype.clearEntries = function() {
		this._entries = {};
	};

	LoadDelegate = function() {
	}
	
	LoadDelegate.prototype.loadCompleted = function(callback, obj) {
		callback.call(Window, obj);
	}
	
	// Loader

	var ThreeGLTFLoader = Object.create(glTFParser, {

		load: {
			enumerable: true,
			value: function(loadContext, options) {
				this.loadContext = loadContext
				this.resources = new Resources();
				this.cameras = [];
				this.lights = [];
				this.animations = [];
				this.joints = {};
				glTFParser.load.call(this, loadContext, options);
			}
		},

		cameras: {
			enumerable: true,
			writable: true,
			value : []
		},

		lights: {
			enumerable: true,
			writable: true,
			value : []
		},
		
		animations: {
			enumerable: true,
			writable: true,
			value : []
		},
		
		// Implement WebGLTFLoader handlers

		handleBuffer: {
			value: function(entryID, description, loadContext) {
				this.resources.setEntry(entryID, null, description);
				description.type = "ArrayBuffer";
				return true;
			}
		},

		handleBufferView: {
			value: function(entryID, description, loadContext) {
				this.resources.setEntry(entryID, null, description);

				var buffer =  this.resources.getEntry(description.buffer);
				description.type = "ArrayBufferView";

				var bufferViewEntry = this.resources.getEntry(entryID);
				bufferViewEntry.buffer = buffer;
				return true;
			}
		},

		handleShader: {
			value: function(entryID, description, loadContext) {
				this.resources.setEntry(entryID, null, description);
				var shaderRequest = {
						id : entryID,
						uri : description.uri,
				};

				var shaderContext = new ShaderContext(entryID, description.uri);

				loadContext.shadersRequested++;
				THREE.GLTFLoaderUtils.getFile(shaderRequest, this.loadContext.shaderDelegate, shaderContext);
				
				return true;
			}
		},

		handleProgram: {
			value: function(entryID, description, loadContext) {
				this.resources.setEntry(entryID, null, description);
				return true;
			}
		},

		handleTechnique: {
			value: function(entryID, description, loadContext) {
				description.refCount = 0;
				this.resources.setEntry(entryID, null, description);
				return true;
			}
		},

		
		createShaderParams : {
			value: function(materialId, values, params, programID, technique) {
				var program = this.resources.getEntry(programID);
				
				params.uniforms = {};
				params.attributes = {};
				params.program = program;
				params.technique = technique;
				if (program) {
					params.fragmentShader = program.description.fragmentShader;
					params.vertexShader = program.description.vertexShader;
					for (var uniform in technique.uniforms) {
						var pname = technique.uniforms[uniform];
						var shaderParam = technique.parameters[pname];
						var ptype = shaderParam.type;
						var pcount = shaderParam.count;
						var value = values[pname];
						var utype = "";
						var uvalue;
						var ulength;

						// THIS: for (n in WebGLRenderingContext) { z = WebGLRenderingContext[n]; idx[z] = n; }
						//console.log("shader uniform param type: ", ptype, "-", this.loadContext.idx[ptype])

						
						switch (ptype) {
							case WebGLRenderingContext.FLOAT :
								utype = "f";
								uvalue = shaderParam.value;
								if (pname == "transparency") {
									var USE_A_ONE = true; // for now, hack because file format isn't telling us
									var opacity =  USE_A_ONE ? value : (1.0 - value);
									uvalue = opacity;
									params.transparent = true;                                    
								}
								break;
							case WebGLRenderingContext.FLOAT_VEC2 :
								utype = "v2";
								uvalue = new THREE.Vector2;
								if (shaderParam && shaderParam.value) {
									var v2 = shaderParam.value;
									uvalue.fromArray(v2);
								}
								if (value) {
									uvalue.fromArray(value);
								}
								break;
							case WebGLRenderingContext.FLOAT_VEC3 :
								utype = "v3";
								uvalue = new THREE.Vector3;
								if (shaderParam && shaderParam.value) {
									var v3 = shaderParam.value;
									uvalue.fromArray(v3);
								}
								if (value) {
									uvalue.fromArray(value);
								}
								break;
							case WebGLRenderingContext.FLOAT_VEC4 :
								utype = "v4";
								uvalue = new THREE.Vector4;
								if (shaderParam && shaderParam.value) {
									var v4 = shaderParam.value;
									uvalue.fromArray(v4);
								}
								if (value) {
									uvalue.fromArray(value);
								}
								break;
							case WebGLRenderingContext.FLOAT_MAT2 :
								// what to do?
								console.log("Warning: FLOAT_MAT2");
								break;
							case WebGLRenderingContext.FLOAT_MAT3 :
								utype = "m3";
								uvalue = new THREE.Matrix3;
								if (shaderParam && shaderParam.value) {
									var m3 = shaderParam.value;
									uvalue.fromArray(m3);
								}
								if (value) {
									uvalue.fromArray(value);
								}
								break;
							case WebGLRenderingContext.FLOAT_MAT4 :
								if (pcount !== undefined) {
									utype = "m4v";
									uvalue = new Array(pcount);
									for (var mi = 0; mi < pcount; mi++) {
										uvalue[mi] = new THREE.Matrix4;
									}
									ulength = pcount;

									if (shaderParam && shaderParam.value) {
										var m4v = shaderParam.value;
										uvalue.fromArray(m4v);
									}
									if (value) {
										uvalue.fromArray(value);

									}                                    
								}
								else {
									utype = "m4";
									uvalue = new THREE.Matrix4;

									if (shaderParam && shaderParam.value) {
										var m4 = shaderParam.value;
										uvalue.fromArray(m4);
									}
									if (value) {
										uvalue.fromArray(value);

									}                                    
								}
								break;
							case WebGLRenderingContext.SAMPLER_2D :
								utype = "t";
								uvalue = value ? CreateTexture(this.resources, value) : null;
								break;
							default :
								throw new Error("Unknown shader uniform param type: " + ptype + " - " + loadContext.idx[ptype]);

								break;
						}


						var udecl = { type : utype, value : uvalue, length : ulength };

						params.uniforms[uniform] = udecl;
					}

					for (var attribute in technique.attributes) {
						var pname = technique.attributes[attribute];
						var param = technique.parameters[pname];
						var atype = param.type;
						var semantic = param.semantic;
						var adecl = { type : atype, semantic : semantic };

						params.attributes[attribute] = adecl;
					}
					
				}
			}
		},
		
		threeJSMaterialType : {
			value: function(materialId, material, params) {

				var extensions = material.extensions;
				var khr_material = extensions ? extensions.KHR_materials_common : null;

				var materialType = null;
				var values;

				if (khr_material) {

					switch (khr_material.technique)
					{
						case 'BLINN' :
						case 'PHONG' :
							materialType = THREE.MeshPhongMaterial;
							break;

						case 'LAMBERT' :
							materialType = THREE.MeshLambertMaterial;
							break;
							
						case 'CONSTANT' :
						default :
							materialType = THREE.MeshBasicMaterial;
							break;
					}
					
					if (khr_material.doubleSided)
					{
						params.side = THREE.DoubleSide;
					}

					if (khr_material.transparent)
					{
						params.transparent = true;
					}

					values = {};
					for (prop in khr_material.values) {
						values[prop] = khr_material.values[prop];
					}

				}
				else {
					var technique = material.technique ? 
						this.resources.getEntry(material.technique) :
						null;

					values = material.values;
					var description = technique.description;

					if (++description.refCount > 1) {
						//console.log("refcount", description.refCount);
					}
					
					var programID = description.program;
					this.createShaderParams(materialId, values, params, programID, description);
					
					var loadshaders = true;
					
					if (loadshaders) {
						materialType = Material;
					}
				}
				
				if (values.diffuse && typeof(values.diffuse) == 'string') {
					params.map = CreateTexture(this.resources, values.diffuse);
				}
				if (values.reflective && typeof(values.reflective) == 'string') {
					params.envMap = CreateTexture(this.resources, values.reflective);
				}
		 
				var shininess = values.shininesss || values.shininess; // N.B.: typo in converter!
				if (shininess)
				{
					shininess = shininess;
				}
				
				var diffuseColor = null;
				if (!params.map) {
					diffuseColor = values.diffuse;
				}
				var opacity = 1.0;
				if (values.hasOwnProperty("transparency"))
				{
					var USE_A_ONE = true; // for now, hack because file format isn't telling us
					opacity =  USE_A_ONE ? values.transparency : (1.0 - values.transparency);
				}
				
				// if (diffuseColor) diffuseColor = [0, 1, 0];
									
				params.color = RgbArraytoHex(diffuseColor);
				params.opacity = opacity;
				params.transparent = opacity < 1.0;
				// hack hack hack
				if (params.map && params.map.sourceFile.toLowerCase().indexOf(".png") != -1)
					params.transparent = true;
				
				if (!(shininess === undefined))
				{
					params.shininess = Math.max( shininess, 1e-4 );
				}
				
				delete params.ambient;
				if (!(values.ambient === undefined) && !(typeof(values.ambient) == 'string'))
				{
					//params.ambient = RgbArraytoHex(values.ambient);
				}

				if (!(values.emission === undefined))
				{
					params.emissive = RgbArraytoHex(values.emission);
				}
				
				if (!(values.specular === undefined))
				{
					params.specular = RgbArraytoHex(values.specular);
				}

				return materialType;
				
			}
		},
		
		handleMaterial: {
			value: function(entryID, description, loadContext) {
				var params = {};
				
				var materialType = this.threeJSMaterialType(entryID, description, params);

				var material = new materialType(params);
				
				this.resources.setEntry(entryID, material, description);

				return true;
			}
		},

		handleMesh: {
			value: function(entryID, description, loadContext) {
				var self = this
				var mesh = new Mesh();
				this.resources.setEntry(entryID, mesh, description);
				var primitivesDescription = description.primitives;
				if (!primitivesDescription) {
					//FIXME: not implemented in delegate
					console.log("MISSING_PRIMITIVES for mesh:"+ entryID);
					return false;
				}

				for (var i = 0 ; i < primitivesDescription.length ; i++) {
					var primitiveDescription = primitivesDescription[i];
					
					if (primitiveDescription.mode === WebGLRenderingContext.TRIANGLES) {

						var geometry = new ClassicGeometry();
						var materialEntry = this.resources.getEntry(primitiveDescription.material);

						mesh.addPrimitive(geometry, materialEntry.object);

						var allAttributes = Object.keys(primitiveDescription.attributes);

						// count them first, async issues otherwise
						allAttributes.forEach( function(semantic) {
							geometry.totalAttributes++;
						}, this);

						var indices = this.resources.getEntry(primitiveDescription.indices);
						var bufferEntry = this.resources.getEntry(indices.description.bufferView);
						var indicesObject = {
								bufferView : bufferEntry,
								byteOffset : indices.description.byteOffset,
								count : indices.description.count,
								id : indices.entryID,
								componentType : indices.description.componentType,
								type : indices.description.type
						};
						
						var indicesContext = new IndicesContext(indicesObject, geometry);
						var loaddata = { 
							indicesObject : indicesObject,
							indicesDelegate : this.loadContext.indicesDelegate,
							indicesContext : indicesContext
						};

						this.loadContext.scheduleLoad(function(data) {
							var alreadyProcessedIndices = 
								THREE.GLTFLoaderUtils.getBuffer(data.indicesObject, 
									data.indicesDelegate, data.indicesContext);

							if (alreadyProcessedIndices) {
								data.indicesDelegate.resourceAvailable(
									alreadyProcessedIndices, data.indicesContext);
							}

						}, loaddata);

						// Load Vertex Attributes
						allAttributes.forEach( function(semantic) {

							var attribute;
							var attributeID = primitiveDescription.attributes[semantic];
							var attributeEntry = this.resources.getEntry(attributeID);
							if (!attributeEntry) {
								//let's just use an anonymous object for the attribute
								attribute = description.attributes[attributeID];
								attribute.id = attributeID;
								this.resources.setEntry(attributeID, attribute, attribute);
			
								var bufferEntry = this.resources.getEntry(attribute.bufferView);
								attributeEntry = this.resources.getEntry(attributeID);

							} else {
								attribute = attributeEntry.object;
								attribute.id = attributeID;
								var bufferEntry = this.resources.getEntry(attribute.bufferView);
							}

							var attributeObject = {
									bufferView : bufferEntry,
									byteOffset : attribute.byteOffset,
									byteStride : attribute.byteStride,
									count : attribute.count,
									max : attribute.max,
									min : attribute.min,
									componentType : attribute.componentType,
									type : attribute.type,
									id : attributeID             
							};
							
							var attribContext = new VertexAttributeContext(attributeObject, semantic, geometry);

							var loaddata = { 
								attributeObject : attributeObject,
								vertexAttributeDelegate : this.loadContext.vertexAttributeDelegate,
								attribContext : attribContext
							};

							self.loadContext.scheduleLoad(function(data) {
								var alreadyProcessedAttribute = 
									THREE.GLTFLoaderUtils.getBuffer(data.attributeObject, 
										data.vertexAttributeDelegate, data.attribContext);

								if (alreadyProcessedAttribute) {
									data.vertexAttributeDelegate.resourceAvailable(
										alreadyProcessedAttribute, data.attribContext);
								}

							}, loaddata);


						}, this);
					}
				}
				return true;
			}
		},

		handleCamera: {
			value: function(entryID, description, loadContext) {
				var camera;
				if (description.type == "perspective")
				{
					var znear = description.perspective.znear;
					var zfar = description.perspective.zfar;
					var yfov = description.perspective.yfov;                    
					var xfov = description.perspective.xfov;
					var aspect_ratio = description.perspective.aspect_ratio;

					if (!aspect_ratio)
						aspect_ratio = 1; 

					if (xfov === undefined) {
						if (yfov)
						{
							// According to COLLADA spec...
							// aspect_ratio = xfov / yfov
							xfov = yfov * aspect_ratio;
						}
					}
					
					if (yfov === undefined)
					{
						if (xfov)
						{
							// According to COLLADA spec...
							// aspect_ratio = xfov / yfov
							yfov = xfov / aspect_ratio;
						}
						
					}
					
					if (xfov)
					{
						xfov = THREE.Math.radToDeg(xfov);

						camera = new THREE.PerspectiveCamera(xfov, aspect_ratio, znear, zfar);
					}
				}
				else
				{
					camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, znear, zfar );
				}
				
				if (camera)
				{
					this.resources.setEntry(entryID, camera, description);
				}
				
				return true;
			}
		},

		handleLight: {
			value: function(entryID, description, loadContext) {

				var light = null;
				var type = description.type;
				if (type && description[type])
				{
					var lparams = description[type];
					var color = RgbArraytoHex(lparams.color);
					
					switch (type) {
						case "directional" :
							light = new THREE.DirectionalLight(color);
							light.position.set(0, 0, 1);
						break;
						
						case "point" :
							light = new THREE.PointLight(color);
						break;
						
						case "spot " :
							light = new THREE.SpotLight(color);
							light.position.set(0, 0, 1);
						break;
						
						case "ambient" : 
							light = new THREE.AmbientLight(color);
						break;
					}
				}

				if (light)
				{
					this.resources.setEntry(entryID, light, description);   
				}
				
				return true;
			}
		},

		addPendingMesh: {
			value: function(mesh, threeNode) {
				this.loadContext.pendingMeshes.push({
					mesh: mesh,
					node: threeNode
				});
			}
		},
		
		handleNode: {
			value: function(entryID, description, loadContext) {

				var threeNode = null;
				if (description.jointName) {
					threeNode = new THREE.Bone();
					threeNode.jointName = description.jointName;
					this.joints[description.jointName] = entryID;
				}
				else {
					threeNode = new THREE.Object3D();
				}
				
				threeNode.name = description.name;
				threeNode.glTFID = entryID;
				threeNode.glTF = description;

				this.resources.setEntry(entryID, threeNode, description);

				var m = description.matrix;
				if(m) {
					threeNode.matrixAutoUpdate = false;
					threeNode.applyMatrix(new THREE.Matrix4().set(
						m[0],  m[4],  m[8],  m[12],
						m[1],  m[5],  m[9],  m[13],
						m[2],  m[6],  m[10], m[14],
						m[3],  m[7],  m[11], m[15]
					));                    
				}
				else {
					var t = description.translation;
					var r = description.rotation;
					var s = description.scale;
					
					var position = t ? new THREE.Vector3(t[0], t[1], t[2]) :
						new THREE.Vector3;

					var rotation = r ? new THREE.Quaternion(r[0], r[1], r[2], r[3]) :
						new THREE.Quaternion;
					var scale = s ? new THREE.Vector3(s[0], s[1], s[2]) :
						new THREE.Vector3(1, 1, 1);
					
					var matrix = new THREE.Matrix4;
					matrix.compose(position, rotation, scale);
					threeNode.matrixAutoUpdate = false;
					threeNode.applyMatrix(matrix);                    
				}

				if (description.meshes) {
					description.meshInstances = {};
					var skinEntry;
					if (description.skin) {
						skinEntry =  this.resources.getEntry(description.skin);
					}

					description.meshes.forEach( function(meshID) {
						var meshEntry = this.resources.getEntry(meshID);
						this.loadContext.meshesRequested++;

						var self = this
						meshEntry.object.onComplete(function(mesh) {
							self.addPendingMesh(mesh, threeNode);
							description.meshInstances[meshID] = meshEntry.object;
							if (skinEntry) {
								mesh.skin = skinEntry;
								description.instanceSkin = skinEntry.object;                        
							}

							self.loadContext.meshesLoaded++;
							self.loadContext.checkComplete(self);
						});
					}, this);
				}
								
				if (description.camera) {
					var cameraEntry = this.resources.getEntry(description.camera);
					if (cameraEntry) {
						threeNode.add(cameraEntry.object);
						this.cameras.push(cameraEntry.object);
					}
				}

				if (description.extensions && description.extensions.KHR_materials_common 
						&& description.extensions.KHR_materials_common.light) {
					var lightID = description.extensions.KHR_materials_common.light;
					var lightEntry = this.resources.getEntry(lightID);
					if (lightEntry) {
						threeNode.add(lightEntry.object);
						this.lights.push(lightEntry.object);
					}
				}
				
				return true;
			}
		},

		handleExtension: {
			value: function(entryID, description, loadContext) {

				// console.log("Extension", entryID, description);

				switch (entryID) {
					case 'KHR_materials_common' :
						var lights = description.lights;
						for (lightID in lights) {
							var light = lights[lightID];
							this.handleLight(lightID, light);
						}
						break;                    
				}
				
				return true;
			}
		},
		
		buildNodeHierarchy: {
			value: function(nodeEntryId, parentThreeNode) {
				var nodeEntry = this.resources.getEntry(nodeEntryId);
				var threeNode = nodeEntry.object;
				parentThreeNode.add(threeNode);

				var children = nodeEntry.description.children;
				if (children) {
					children.forEach( function(childID) {
						this.buildNodeHierarchy(childID, threeNode);
					}, this);
				}

				return threeNode;
			}
		},

		buildSkin: {
			value: function(node) {
			
				var glTF = node.glTF;
				var skin = glTF.instanceSkin;
				var skeletons = glTF.skeletons;
				if (skin) {
					skeletons.forEach(function(skeleton) {
						var nodeEntry = this.resources.getEntry(skeleton);
						if (nodeEntry) {

							var rootSkeleton = nodeEntry.object;
							node.add(rootSkeleton);

							var dobones = true;

							for (meshID in glTF.meshInstances) {
								var mesh = glTF.meshInstances[meshID];
								mesh.primitives.forEach(function(primitive) {

									var material = primitive.material;
									var materialParams = material.params;
									if (!(material instanceof THREE.Material)) {
										material = createShaderMaterial(this.loadContext, material);
									}

									var geometry = primitive.geometry.geometry;
									var boneInverses = [];
									if (dobones) {
										material.skinning = true;
										var jointNames = skin.jointNames;

										geometry.bones = []

										var i, len = jointNames.length
										var joints = []
										for (i = 0; i < len; ++i) {
											var jointName = jointNames[i];
											var nodeForJoint = this.joints[jointName];
											var joint = this.resources.getEntry(nodeForJoint).object;
											if (joint) {
												joints.push(joint)

												var parentIdx = -1

												if (joint.parent && joint.parent instanceof THREE.Bone) {
													parentIdx = joints.indexOf(joint.parent)
													console.log(joint.glTFID, joints.length - 1, 'has parent', parentIdx, joints[parentIdx].glTFID)
												}

												var m = skin.inverseBindMatrices;
												var mat = new THREE.Matrix4().set(
													m[i * 16 + 0],  m[i * 16 + 4],  m[i * 16 + 8],  m[i * 16 + 12],
													m[i * 16 + 1],  m[i * 16 + 5],  m[i * 16 + 9],  m[i * 16 + 13],
													m[i * 16 + 2],  m[i * 16 + 6],  m[i * 16 + 10], m[i * 16 + 14],
													m[i * 16 + 3],  m[i * 16 + 7],  m[i * 16 + 11], m[i * 16 + 15]);
												boneInverses.push(mat);

												var gbone = {
													name: joint.glTFID,
													pos: [joint.position.x, joint.position.y, joint.position.z],
													rotq: [joint.quaternion.x, joint.quaternion.y, joint.quaternion.z, joint.quaternion.w],
													scl: [joint.scale.x, joint.scale.y, joint.scale.z],
													parent: parentIdx
												}

												geometry.bones.push(gbone)
											}
										}
									}

									var threeMesh = new THREE.SkinnedMesh(geometry, material, false, skin.bindShapeMatrix);

									// we do need to override the boneinverses. Three gets these wrong.
									threeMesh.skeleton.boneInverses = []
									for (var i = 0; i < boneInverses.length; ++i) {
										threeMesh.skeleton.boneInverses.push(boneInverses[i])
									}

									if (threeMesh) {
										threeMesh.castShadow = true;
										node.add(threeMesh);

										if (material instanceof THREE.ShaderMaterial) {
											var glTFShader = new THREE.glTFShader(material, materialParams, threeMesh, this.loadContext.rootObj);
											THREE.glTFShaders.add(glTFShader);

										}
									}
									
								}, this);                               
							}
							
						}

					
					}, this);
					
				}
			}
		},
		 
		buildSkins: {
			value: function(node) {

				if (node.glTF && node.glTF.instanceSkin)
					this.buildSkin(node);
				
				var children = node.children;
				if (children) {
					children.forEach( function(child) {
						this.buildSkins(child);
					}, this);
				}
			}
		},
		
		createMeshAnimations : {
			value : function(root) {
					this.buildSkins(root);
				}
		},        

		handleScene: {
			value: function(entryID, description, loadContext) {

				if (!description.nodes) {
					console.log("ERROR: invalid file required nodes property is missing from scene");
					return false;
				}

				description.nodes.forEach( function(nodeUID) {
					this.buildNodeHierarchy(nodeUID, this.loadContext.rootObj);
				}, this);

				if (this.delegate) {
					this.delegate.loadCompleted(this.loadContext.onSceneLoadedCallback, this.loadContext.rootObj);
				}

				this.loadContext.loadAllAssets();

				return true;
			}
		},

		handleImage: {
			value: function(entryID, description, loadContext) {
				this.resources.setEntry(entryID, null, description);
				return true;
			}
		},
		
		addNodeAnimationChannel : {
			value : function(name, channel, interp) {
				if (!this.nodeAnimationChannels)
					this.nodeAnimationChannels = {};
				
				if (!this.nodeAnimationChannels[name]) {
					this.nodeAnimationChannels[name] = [];
				}
				
				this.nodeAnimationChannels[name].push(interp);
			},
		},
		
		createAnimations : {
			value : function() {
				for (var name in this.nodeAnimationChannels) {
					var nodeAnimationChannels = this.nodeAnimationChannels[name];
					var i, len = nodeAnimationChannels.length;
					//console.log(" animation channels for node " + name);
					//for (i = 0; i < len; i++) {
					//  console.log(nodeAnimationChannels[i]);
					//}
					var anim = new THREE.glTFAnimation(nodeAnimationChannels);
					anim.name = "animation_" + name;
					this.animations.push(anim);                     
				}
			}
		},

		bindAnimations : {
			value: function(rootNode) {
				for (var name in this.nodeAnimationChannels) {
					var animChannel = this.nodeAnimationChannels[name]
					for (var i = 0; i < animChannel.length; ++i) {

						function findTarget(id) {
							var target = undefined
							rootNode.traverse(function(n) {
								if (target) {
									return
								}

								if (n instanceof THREE.SkinnedMesh) {
									for (var i = 0; target === undefined && i < n.skeleton.bones.length; ++i) {
										if (n.skeleton.bones[i].name === id) {
											target = n.skeleton.bones[i]
										}
									}
								}
							})
							if (!target) {
								rootNode.traverse(function (n) {
									if (target) {
										return
									}

									if (n.glTFID === id) {
										target = n
									}
								})
							}

							return target
						}

						var target = findTarget(animChannel[i].targetID)
						if (!target) {
							console.error('glTFLoader.bindAnimations - cannot find target for', animChannel[i].targetID)
						}

						animChannel[i].target = target
					}
				}
			}
		},
		
		buildAnimation: {
			value : function(animation, rootNode) {
			
				var i, len = animation.channels.length;
				for (i = 0; i < len; i++) {
					
					var channel = animation.channels[i];
					var sampler = animation.samplers[channel.sampler];
					if (sampler) {
	
						var input = animation.parameters[sampler.input];
						if (input && input.data) {
							
							var output = animation.parameters[sampler.output];
							if (output && output.data) {
								
								var target = channel.target;

								var path = target.path;

								var interp = {
										keys : input.data,
										values : output.data,
										count : input.count,
										targetID: target.id,
										//target : targetObject,
										path : path,
										type : sampler.interpolation
								};

								this.addNodeAnimationChannel(target.id, channel, interp);
							}
						}
					}
				}               
			}
		},
		
		handleAnimation: {
			value: function(entryID, description, loadContext) {

				var self = this;
				this.loadContext.animationsRequested++;
				var animation = new Animation();
				animation.name = entryID;
				animation.onload = function() {
					// self.buildAnimation(animation);
					self.loadContext.animationsLoaded++;
					self.loadContext.animations.push(animation);
					self.loadContext.checkComplete(self);
				};              
				
				animation.channels = description.channels;
				animation.samplers = description.samplers;
				this.resources.setEntry(entryID, animation, description);
				var parameters = description.parameters;
				if (!parameters) {
					//FIXME: not implemented in delegate
					console.log("MISSING_PARAMETERS for animation:"+ entryID);
					return false;
				}
	
				// Load parameter buffers
				var params = Object.keys(parameters);
				params.forEach( function(param) {

					// async help
					animation.totalParameters++;

				}, this);    
							
				var params = Object.keys(parameters);
				params.forEach( function(param) {

					var parameter = parameters[param];
					var accessor = this.resources.getEntry(parameter);
					if (!accessor)
						debugger;
					accessor = accessor.object;
					var bufferView = this.resources.getEntry(accessor.bufferView);
					var paramObject = {
							bufferView : bufferView,
							byteOffset : accessor.byteOffset,
							count : accessor.count,
							componentType : accessor.componentType,
							type : accessor.type,
							id : accessor.bufferView,
							name : param             
					};
					
					var paramContext = new AnimationParameterContext(paramObject, animation);

					var loaddata = { 
						paramObject : paramObject,
						animationParameterDelegate : this.loadContext.animationParameterDelegate,
						paramContext : paramContext
					};

					this.loadContext.scheduleLoad(function(data) {

						var alreadyProcessedAttribute = 
							THREE.GLTFLoaderUtils.getBuffer(data.paramObject, 
								data.animationParameterDelegate, data.paramContext);

						if (alreadyProcessedAttribute) {
							data.animationParameterDelegate.resourceAvailable(
								alreadyProcessedAttribute, data.paramContext);
						}

					}, loaddata);


				}, this);

				return true;
			}
		},

		handleAccessor: {
			value: function(entryID, description, loadContext) {
				// Save attribute entry
				this.resources.setEntry(entryID, description, description);
				return true;
			}
		},

		handleSkin: {
			value: function(entryID, description, loadContext) {
				// Save skin entry
			
				var skin = {
				};
				
				var m = description.bindShapeMatrix;
				skin.bindShapeMatrix = new THREE.Matrix4().set(
						m[0],  m[4],  m[8],  m[12],
						m[1],  m[5],  m[9],  m[13],
						m[2],  m[6],  m[10], m[14],
						m[3],  m[7],  m[11], m[15]
					);
				
				skin.jointNames = description.jointNames;
				var inverseBindMatricesDescription = this.resources.getEntry(description.inverseBindMatrices);
				inverseBindMatricesDescription = inverseBindMatricesDescription.description;
				skin.inverseBindMatricesDescription = inverseBindMatricesDescription;
				skin.inverseBindMatricesDescription.id = description.inverseBindMatrices;

				var bufferEntry = this.resources.getEntry(inverseBindMatricesDescription.bufferView);

				var paramObject = {
						bufferView : bufferEntry,
						byteOffset : inverseBindMatricesDescription.byteOffset,
						count : inverseBindMatricesDescription.count,
						componentType : inverseBindMatricesDescription.componentType,
						type : inverseBindMatricesDescription.type,
						id : inverseBindMatricesDescription.bufferView,
						name : skin.inverseBindMatricesDescription.id             
				};
				
				var context = new InverseBindMatricesContext(paramObject, skin);

				var loaddata = { 
					paramObject : paramObject,
					inverseBindMatricesDelegate : this.loadContext.inverseBindMatricesDelegate,
					context : context
				};

				this.loadContext.scheduleLoad(function(data) {

					var alreadyProcessedAttribute = 
						THREE.GLTFLoaderUtils.getBuffer(data.paramObject, 
							data.inverseBindMatricesDelegate, data.context);

					if (alreadyProcessedAttribute) {
						data.inverseBindMatricesDelegate.resourceAvailable(
							alreadyProcessedAttribute, data.context);
					}

				}, loaddata);



				var bufferView = this.resources.getEntry(skin.inverseBindMatricesDescription.bufferView);
				skin.inverseBindMatricesDescription.bufferView = 
					bufferView.object;
				this.resources.setEntry(entryID, skin, description);
				return true;
			}
		},

		handleSampler: {
			value: function(entryID, description, loadContext) {
				// Save attribute entry
				this.resources.setEntry(entryID, description, description);
				return true;
			}
		},

		handleTexture: {
			value: function(entryID, description, loadContext) {
				// Save attribute entry
				this.resources.setEntry(entryID, null, description);
				return true;
			}
		},
		
		handleError: {
			value: function(msg) {

				throw new Error(msg);
				return true;
			}
		},
		
		_delegate: {
			value: new LoadDelegate,
			writable: true
		},

		delegate: {
			enumerable: true,
			get: function() {
				return this._delegate;
			},
			set: function(value) {
				this._delegate = value;
			}
		}
	});

	// Loader
	var glTFRootObj = new THREE.Object3D();
	var glTFLoadContext = new THREE.glTFLoadContext(url, glTFRootObj, callback)

	var loader = Object.create(ThreeGLTFLoader);
	loader.initWithPath(url);
	loader.load(glTFLoadContext, null);

	return glTFRootObj;
}
