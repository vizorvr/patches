var uiNodeEventType = {
	positionChanged : 'uiPositionChanged'
};

/**
 * Below values are arbitrary for the purposes of UI development.
 * They are used to set a default css class for every type of known node.
 */
var uiNodeCategory = {
	generic: 		'generic',		//
	compound:		'compound',		// subgraphs
	value:			'value',		// 0.1, true
	logic:			'logic',		// && || !
	math:			'math',			// +, -, atan2
	time: 			'time',			// clocks, etc
	convert: 		'convert',		// vec3d > x,y,z, "string" > float
	loader:			'loader',		// loads content
	data:			'data',			// {json:"rocks", since: 2002}
	text:			'text',			// "hello world"
	io:				'io',			// ports, proxies, beacons, etc.
	interaction:	'interaction',	// e.g. keypress, mouse button
	renderer:		'renderer',		//
	environment:	'environment',	// scene, environment, camera
	light:			'light',		//
	material:		'material',		//
	texture:		'texture',		// bjõõtifül imaajes
	geometry:		'geometry',		// mesh, etc.
	media:			'media',		// audio, video, etc.
	meta:			'meta'			// annotations, control, player events, anything else about the scene that isn't the scene itself
};

var uiNodeCategoryMap = {};

/**
 * Maps plugin ID (e.g. three_scene) to uiNodeCategory
 */
(function(){
	var c = uiNodeCategory;
	uiNodeCategoryMap = {
		'graph': 			c.compound,
		'loop': 			c.compound,
		'array_function': 	c.compound,

		'three_scene' : 				c.environment,
		'three_environment_settings' : 	c.environment,
		'three_vr_camera'			: c.environment,
		'three_perspective_camera'	: c.environment,
		'three_screen_space_transform_extractor'	: c.environment,
		'three_webgl_renderer' : 		c.renderer,
		'three_webgl_texture_renderer':	c.renderer,

		'output_proxy': 		c.io,
		'input_proxy': 			c.io,
		'variable_local_read':	c.io,
		'variable_local_write':	c.io,

		'three_mesh'	: c.geometry,
		'three_geometry_box'	: c.geometry,
		'three_geometry_circle'	: c.geometry,
		'three_geometry_cylinder'	: c.geometry,
		'three_geometry_dodecahedron'	: c.geometry,
		'three_geometry_sphere'	: c.geometry,
		'three_geometry_plane'	: c.geometry,
		'three_procedural_ground'	: c.geometry,
		'three_point_cloud_mesh'	: c.geometry,
		'three_particle_emitter'	: c.geometry,
		'three_line_segments'	: c.geometry,
		'three_object3d_attribute_extractor'	: c.geometry,	// position, rotation, scale
		'stereo_cube_map'		: c.geometry,

		'three_loader_model'	: c.loader,
		'three_loader_scene'	: c.loader,
		'url_array_generator'	: c.loader,
		'url_audio_generator'	: c.loader,
		'url_audio_buffer_generator'	: c.loader,
		'url_video_generator'	: c.loader,
		'url_json_generator'	: c.loader,

		'three_material' : c.material,
		'three_material_depth' : c.material,
        'three_material_lambert' : c.material,
        'three_material_phong' : c.material,
        'three_material_shader' : c.material,
        'three_point_cloud_material' : c.material,
        'three_material_modifier' : c.material,
        'three_uv_modifier' : c.material,
        'three_line_material' : c.material,
        'three_material_extractor' : c.material,

        'three_ambient_light' : c.light,
        'three_directional_light' : c.light,
        'three_point_light' : c.light,

		'url_texture_generator'	: 	c.texture,
		'texture_from_text_generator' : c.texture,

		'action_button' : 			c.value,
        'blend_mode_generator' : 	c.value,
        'color_picker' : 			c.value,
        'text_editor_generator' : 	c.value,
        'const_float_generator' : 	c.value,
        'knob_float_generator' : 	c.value,
        'label_generator' : 		c.value,
        'pi_generator' : 			c.value,
        'random_float_generator' : 	c.value,
        'slider_float_generator' : 	c.value,
        'const_text_generator' : 	c.value,
        'toggle_button' : 			c.value,
        'object_add' : 				c.value,
        'envelope_modulator' : 		c.value,

		
		'absolute_modulator' : c.math,
        'cos_modulator' 	: c.math,
        'exp_modulator' 	: c.math,
        'log_modulator' 	: c.math,
        'max_modulator' 	: c.math,
        'min_modulator' 	: c.math,
        'sin_modulator' 	: c.math,
        'sqrt_modulator' 	: c.math,
        'tan_modulator' 	: c.math,
        'atan_modulator' 	: c.math,
        'atan2_modulator' 	: c.math,
        'ceiling_modulator' : c.math,
        'floor_modulator'	: c.math,
        'round_modulator'	: c.math,
        'accumulate_modulator' : c.math,
        'clamped_accumulate_modulator' : c.math,
        'delta_modulator'	: c.math,
        'add_modulator'		: c.math,
        'clamp_modulator'	: c.math,
        'divide_modulator'	: c.math,
        'modulate_modulator': c.math,
        'multiply_modulator': c.math,
        'negate_modulator'	: c.math,
        'subtract_modulator': c.math,
        'lowpass_filter_modulator' : c.math,
        'sample_and_hold_modulator' : c.math,


		'if_modulator'		: c.logic,
        'if_else_modulator'	: c.logic,
        'equals_modulator'	: c.logic,
        'ne_modulator'		: c.logic,
        'less_than_modulator' : c.logic,
        'lte_modulator'		: c.logic,
        'more_than_modulator' : c.logic,
        'gte_modulator'		: c.logic,
        'near_eq_modulator'	: c.logic,
        'and_modulator'		: c.logic,
        'nand_modulator'	: c.logic,
        'not_modulator'		: c.logic,
        'or_modulator'		: c.logic,
        'xor_modulator'		: c.logic,
        'switch_modulator'	: c.logic,
        'array_switch_modulator' : c.logic,
        'toggle_modulator'	: c.logic,
        'change_trigger'	: c.logic,
		
        'three_gaze_clicker'	: c.interaction,
		'three_clickable_object': c.interaction,
		'key_press_generator'	: c.interaction,
        'touching_generator'	: c.interaction,
        'touch_start_generator'	: c.interaction,
        'touch_end_generator'	: c.interaction,
        'mouse_button_generator': c.interaction,
        'mouse_position_generator': c.interaction,
        'mouse_wheel_generator'	: c.interaction,
        'gamepad_generator'		: c.interaction,

        'parse_json_modulator'	: c.data,

		'annotation'					: c.meta,
		'stop_emitter'					: c.meta,
        'load_graph'					: c.meta,
        'initialise_generator'			: c.meta,
        'assets_completed_generator' 	: c.meta,
        'assets_signal_completed_generator' : c.meta,
        'assets_failed_generator' 		: c.meta,
        'assets_signal_failed_generator' : c.meta,
        'assets_started_generator' 		: c.meta,
        'assets_signal_started_generator' : c.meta,

		'runtime_event_write'			: c.meta,
		'runtime_event_write_continuous': c.meta,
		'runtime_event_read'			: c.meta


		// everything else is c.generic

/*

    "RENDERING BASICS": {
        "Render To Screen": "three_webgl_renderer",
        "Render To Texture": "three_webgl_texture_renderer",
        "Scene": "three_scene",
        "Environment Settings": "three_environment_settings"

    },

    "3D GEOMETRY AND MESH TOOLS": {
        "Box": "three_geometry_box",
        "Circle": "three_geometry_circle",
        "Cylinder": "three_geometry_cylinder",
        "Dodecahedron": "three_geometry_dodecahedron",
        "Sphere": "three_geometry_sphere",
        "Plane": "three_geometry_plane",
        "Procedural Ground": "three_procedural_ground",
        "Mesh": "three_mesh",
        "Point Cloud Mesh": "three_point_cloud_mesh",
        "3D Geometry Loader": "three_loader_model",
        "Particle Emitter": "three_particle_emitter",
        "3D Model Loader": "three_loader_scene",
        "Mesh attributes": "three_object3d_attribute_extractor",
        "Line Segments": "three_line_segments"
    },

    "MATERIALS AND LIGHTS": {
        "Basic Material": "three_material",
        "Depth Material": "three_material_depth",
        "Lambert Material": "three_material_lambert",
        "Phong Material": "three_material_phong",
        "Shader": "three_material_shader",
        "Point Cloud Material": "three_point_cloud_material",
        "Material Modifier": "three_material_modifier",
        "UV Modifier": "three_uv_modifier",
        "Ambient Light": "three_ambient_light",
        "Directional Light": "three_directional_light",
        "Point Light": "three_point_light",
        "Line Material": "three_line_material",
        "Material Extractor": "three_material_extractor"
    },


    "STATE AND STRUCTURE": {
        "Read Variable": "variable_local_read",
        "Write Variable": "variable_local_write",
        "Input proxy": "input_proxy",
        "Output proxy": "output_proxy",
        "Graph": "graph",
        "Loop": "loop",
        "Array Function": "array_function",
        "Annotation": "annotation"

    },



    "PLAYERS": {
        "Audio player": "audio_player",
        "Audio source player": "audio_source_player",
        "Module player": "module_player",
        "Video player": "video_player"
    },

       "AUDIO": {
        "Audio player": "audio_player",
        "Audio source player": "audio_source_player",
        "Analyse": "audio_analyse_modulator",
        "Buffer source": "audio_buffer_source_modulator",
        "Delay": "audio_delay_modulator",
        "Current time": "audio_get_current_time_modulator",
        "Duration": "audio_get_duration_modulator",
        "Gain (mix)": "audio_gain_modulator"
    },

    "DEBUG TOOLS": {
        "Bool": "bool_display",
        "Color": "color_display",
        "Data info": "data_info_display",
        "Float": "float_display",
        "Led": "led_display",
        "Log": "log_display",
        "Matrix": "matrix_display",
        "Plot": "plot_display",
        "Text": "text_display",
        "Object": "object_display",
        "Vector": "vector_display"
    },

    "GRAPH CONTROL": {
        "Stop playback": "stop_emitter",
        "Load graph": "load_graph",
        "Initialise": "initialise_generator",
        "Completed": "assets_completed_generator",
        "Completed emitter": "assets_signal_completed_generator",
        "Failed": "assets_failed_generator",
        "Failed emitter": "assets_signal_failed_generator",
        "Started": "assets_started_generator",
        "Started emitter": "assets_signal_started_generator"

    },

    "INPUT METHODS": {
        "Key press": "key_press_generator",
        "Touching": "touching_generator",
        "Touch Start": "touch_start_generator",
        "Touch End": "touch_end_generator",
        "Mouse buttons": "mouse_button_generator",
        "Mouse position": "mouse_position_generator",
        "Mouse wheel": "mouse_wheel_generator",
        "Game pad": "gamepad_generator"
    },


    "TEXT TOOLS": {
        "From text": "texture_from_text_generator",
        "Concatenate": "string_concatenate_modulator",
        "Parse JSON": "parse_json_modulator"
    },

    "CLOCKS": {
        "Clock": "clock_generator",
        "Delta time": "delta_t_generator"
    },

    "ARRAYS & OBJECTS": {
        "Inputs to Array": "inputs_to_array",
        "Array Set": "array_set",
        "Array Get": "array_get",
        "Array Remove": "array_remove",
        "Array Clear": "array_clear",
        "Array Length": "array_length",
        "Object array length": "member_array_length_modulator",
        "Object member to bool": "member_to_bool_modulator",
        "Object member to float": "member_to_float_modulator",
        "Object member to object": "member_to_object_modulator",
        "Object member to string": "member_to_string_modulator",
        "Object member to typed array": "member_to_typed_array_modulator"
    },

    "TYPED ARRAYS": {
        "Typed array": "typed_array_generator",
        "Typed array item to bool": "typed_array_item_to_bool_modulator",
        "Typed array item to float": "typed_array_item_to_float_modulator",
        "Typed array item to object": "typed_array_item_to_object_modulator",
        "Typed array item to string": "typed_array_item_to_string_modulator",
        "Typed array item to typed array": "typed_array_item_to_typed_array_modulator",
        "Typed array to texture": "typed_array_to_texture_modulator",
        "Get typed array": "typed_array_get_modulator",
        "Get typed array as": "typed_array_get_as_modulator",
        "Typed array Length": "typed_array_length_modulator",
        "Set typed array": "typed_array_set_modulator",
        "Set typed array as": "typed_array_set_as_modulator"
    },


    "COLOR MODULATORS": {
        "Add color": "color_add_modulator",
        "Blend color": "color_blend_modulator",
        "Multiply color": "color_multiply_modulator"
    },

    "CONVERTERS": {
        "Camera matrices": "convert_camera_matrices",
        "Matrices to Camera": "convert_matrices_camera",
        "Color to HSL": "convert_color_hsl_modulator",
        "Color to RGB": "convert_color_rgb_modulator",
        "HSL to Color": "convert_hsl_color_modulator",
        "RGB to Color": "convert_rgb_color_modulator",
        "Float as string": "format_string_float",
        "Bool to Float": "convert_bool_float_modulator",
        "Float to Bool": "convert_float_bool_modulator",
        "Oscilator to unit": "convert_oscilator_unit_modulator",
        "String to float": "convert_string_float_modulator",
        "Vector to XYZ": "convert_vector_xyz_modulator",
        "Vector to screenspace": "vector_to_screenspace",
        "XYZ to Vector": "vector",
        "Object to JSON": "object_stringify"
    },

    "VECTOR MATH": {
        "Add Vector": "vector_add",
        "Cross": "vector_cross",
        "Dot": "vector_dot",
        "Magnitude": "vector_magnitude",
        "Multiply vector": "vector_multiply",
        "Normalize": "vector_normalize",
        "Scale": "vector_scale",
        "Transform": "vector_transform"
    },


    "OSCILLATORS": {
        "Cosine": "cosine_modulator",
        "Sawtooth": "sawtooth_modulator",
        "Sine": "sine_modulator",
        "Square": "square_modulator",
        "Triangle": "triangle_modulator",
        "In Tweens": "tween_in_modulator",
        "Out Tweens": "tween_out_modulator"
    },



    "VIDEO TOOLS": {
        "Duration": "video_get_duration_modulator",
        "Current time": "video_get_current_time_modulator"
    },


	*/
	};
})();

uiNodeCategoryMap.getCategory = function(plugin_id) {
	var ret = ((typeof uiNodeCategoryMap[plugin_id] != 'undefined') && (uiNodeCategoryMap[plugin_id])) ?
				uiNodeCategoryMap[plugin_id] : uiNodeCategory.generic;
	return ret;
};
