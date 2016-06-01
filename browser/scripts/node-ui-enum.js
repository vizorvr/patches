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
		'variable_local_write_conditional':	c.io,

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

        'three_ambient_light' :     c.light,
        'three_directional_light' : c.light,
        'three_point_light' :       c.light,
		'three_spot_light' :        c.light,
		'three_hemisphere_light' :  c.light,

		'url_texture_generator'	: 	c.texture,

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
		'runtime_event_read'			: c.meta,

		'audio_player'					: c.media,
		'audio_source_player'			: c.media,
		'module_player'					: c.media,
		'video_player'					: c.media,

		'audio_get_current_time_modulator'	: c.time,
		'clock_generator'					: c.time,
		'delta_t_generator'					: c.time,
		'video_get_current_time_modulator'	: c.time,

		'texture_from_text_generator'		: c.text,
		'string_concatenate_modulator'		: c.text

		// everything else is c.generic

	};
})();

uiNodeCategoryMap.getCategory = function(plugin_id) {
	return ((typeof uiNodeCategoryMap[plugin_id] !== 'undefined') && (uiNodeCategoryMap[plugin_id])) ?
				uiNodeCategoryMap[plugin_id] : uiNodeCategory.generic;
};

// exceptions to general logic follow

var uiPluginCategoriesThatMustNotDisplayOutputInHeader = []
var uiPluginsThatMustNotDisplayOutputInHeader = [
	'envelope_modulator'
]

var uiPluginsThatForceDisplayOutputInHeader = [	// override the logic (e.g. when dynamic slots)
	'three_scene'
]

var uiPluginCategoriesAutoRenamed = [
	uiNodeCategory.value
]

var uiPluginsThatNeverDisplayInline = [
	'variable_local_write_conditional'
]

var uiPluginsThatAlwaysDisplayInline = [
	'pi_generator',
	'clock_generator',
	'delta_t_generator',
	'initialise_generator',
	'assets_completed_generator',
	'assets_failed_generator',
	'assets_started_generator',
	'mouse_wheel_generator'
]

