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
	interface:		'interface',	// e.g. keypress, mouse button
	renderer:		'renderer',		//
	environment:	'environment',	// scene, environment, camera
	light:			'light',		//
	material:		'material',		//
	texture:		'texture',		// bjõõtifül imaajes
	geometry:		'geometry',		// mesh, etc.
	meta:			'meta'			// annotations, anything else that has no effect on the scene itself
};

var uiNodeCategoryMap = {};

/**
 * Maps plugin ID (e.g. three_scene) to uiNodeCategory
 */
(function(){
	var c = uiNodeCategory;
	uiNodeCategoryMap = {
		'annotation': 		c.meta,
		'graph': 			c.compound,
		'loop': 			c.compound,
		'array_function': 	c.compound,

		'three_scene' : 				c.environment,
		'three_environment_settings' : 	c.environment,
		'three_webgl_renderer' : 		c.renderer,
		'three_webgl_texture_renderer':	c.renderer,

		'output_proxy': 		c.io,
		'input_proxy': 			c.io,
		'variable_local_read':	c.io,
		'variable_local_write':	c.io,

		'three_mesh'	: c.geometry,

		'three_material' : c.material,
		'three_material_depth' : c.material,
        'three_material_lambert' : c.material,
        'three_material_phong' : c.material,
        'three_material_shader' : c.material,
        'three_point_cloud_material' : c.material,
        'three_material_modifier' : c.material,
        'three_uv_modifier' : c.material,

        'three_ambient_light' : c.light,
        'three_directional_light' : c.light,
        'three_point_light' : c.light,

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
        'envelope_modulator' : 		c.value

	};
})();

uiNodeCategoryMap.getCategory = function(plugin_id) {
	var ret = ((typeof uiNodeCategoryMap[plugin_id] != 'undefined') && (uiNodeCategoryMap[plugin_id])) ?
				uiNodeCategoryMap[plugin_id] : uiNodeCategory.generic;
	return ret;
};
