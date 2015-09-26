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
	light:			'light',
	material:		'material',
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
		'three_scene' : 	c.environment,
		'three_webgl_renderer' : c.renderer,
		'three_webgl_texture_renderer' : c.renderer,
		'output_proxy': c.io,
		'color_picker': c.value,
		'three_mesh'	: c.geometry,
		'three_material_depth' : c.material,
        'three_material_lambert' : c.material,
        'three_material_phong' : c.material,
        'three_material_shader' : c.material,
        'three_point_cloud_material' : c.material,
        'three_material_modifier' : c.material,
        'three_uv_modifier' : c.material,
        'three_ambient_light' : c.light,
        'three_directional_light' : c.light,
        'three_point_light' : c.light
	};
})();

uiNodeCategoryMap.getCategory = function(plugin_id) {
	var ret = ((typeof uiNodeCategoryMap[plugin_id] != 'undefined') && (uiNodeCategoryMap[plugin_id])) ?
				uiNodeCategoryMap[plugin_id] : uiNodeCategory.generic;
	return ret;
};
