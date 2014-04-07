E2.p = E2.plugins["mesh_renderer_emitter"] = function(core, node)
{
	this.desc = 'Render the supplied <b>mesh</b>. If no <b>shader</b> is specified, the internal shader (if any) of the <b>mesh</b> is used.';
	
	this.input_slots = [ 
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'The input mesh to be rendered.', def: null },
		{ name: 'shader', dt: core.datatypes.SHADER, desc: 'Connect to this slot to use the supplied shader in favor of the one specified by the mesh (if any).', def: null },
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'Camera to use for rendering.', def: core.renderer.camera_screenspace },
		{ name: 'transform', dt: core.datatypes.MATRIX, desc: 'Mesh transform.', def: core.renderer.matrix_identity }
	];
	
	this.output_slots = [];

	this.gl = core.renderer.context;
};

E2.p.prototype.reset = function()
{
	this.mesh = null;
	this.shader = null;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.mesh = data;
	else if(slot.index === 1)
		this.shader = data;
	else if(slot.index === 2)
		this.camera = data;
	else if(slot.index === 3)
		this.transform = data;
};

E2.p.prototype.update_state = function()
{
	var mesh = this.mesh;
	
	if(!mesh)
		return;
		
	if(this.shader)
		mesh.render(this.camera, this.transform, this.shader, this.shader.material);
	else
		mesh.render(this.camera, this.transform, mesh.shader, mesh.material);
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.camera = new Camera();
		this.transform = mat4.create();

		mat4.identity(this.transform);
	}
};
