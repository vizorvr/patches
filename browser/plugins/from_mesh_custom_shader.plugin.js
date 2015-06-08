(function() {

var FromMeshCustomShader = E2.plugins.from_mesh_custom_shader = function(core, node) {
	var that = this
	this.desc = 'Auto-generate a shader embedding user-defined main bodies tailored to correctly and optimally render the supplied mesh.'
	
	this.input_slots = [
		 { name: 'mesh', dt: core.datatypes.MESH, desc: 'Mesh to adapt the shader to.', def: null },
		 { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The surface material.', def: null }
	]
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER, desc: 'The resulting shader.' } 
	]
	
	this.state = { 
		vs_src: '',
		ps_src: '',
		changed: false,
		slot_ids: {} 
	}

	this.core = core
	this.node = node
	this.gl = core.renderer.context
	this.shader = null
	this.slot_data = []

	this.node.on('slotAdded', function(slot) {
		that.state.slot_ids[slot.name] = {
			id: slot.uid,
			dt: slot.dt,
			uniform: null
		}
		that.slot_data[slot.uid] = that.core.get_default_value(E2.slot_type.input, slot.dt)
		that.updated = that.dirty = true
		that._refreshEditor()
	})

	this.node.on('slotRemoved', function(slot) {
		that.state.slot_ids[slot.name] = null
		delete that.state.slot_ids[slot.name]
		that.updated = that.dirty = true
		that._refreshEditor()
	})
}

FromMeshCustomShader.prototype._refreshEditor = function() {
	var that = this
	if (this._editors) {
		_.each(this._editors, function(ed) {
			ed.setInputs(that.state.slot_ids)
		})
	}
}

FromMeshCustomShader.prototype.destroy_ui = function() {
	_.each(this._editors, function(ed) {
		if (ed.close)
			ed.close()
	})
}

FromMeshCustomShader.prototype.create_ui = function() {
	var that = this
	var layout = make('div')
	var vertexButton = makeButton('Vertex', 'Click to edit the vertex shader source.')
	var pixelButton = makeButton('Pixel', 'Click to edit the pixel shader source.')

	this._editors = {}

	function removeSlot(slotId) {
		E2.app.graphApi.removeSlot(that.node.parent_graph, that.node, slotId)
	} 

	function addSlot(name, dt) {
		E2.app.graphApi.addSlot(that.node.parent_graph, that.node, {
			type: E2.slot_type.input,
			name: name,
			dt: dt
		})
	}

	vertexButton.css('width', '55px')
	pixelButton.css({ 'width': '55px', 'margin-top': '5px' })

	function createEditor(which, srcId) {
		if (that._editors[which]) {
			that._editors[which].show()
			return
		}

		var id = ['', that.node.parent_graph.uid, that.node.uid].join('/')
		var title = [which, 'shader', id].join(' ')

		that._editors[which] = E2.ShaderEditor
			.open(title, that.state[srcId], that.state.slot_ids)
			.on('closed', function() {
				that._editors[which] = null
			})
			.on('inputRemoved', function(slotId, name) {
				removeSlot(slotId, name)
			})
			.on('inputAdded', function(inputName, dt) {
				addSlot(inputName, dt)
			})
			.on('build', function() {
				that.updated = that.dirty = true
			})
			.on('changed', function(v) {
				that.updated = true
				that.state[srcId] = v
			})

		that._editors[which]._ace 
	}

	vertexButton.click(function() {
		createEditor('vertex', 'vs_src')
	})

	pixelButton.click(function() {
		createEditor('pixel', 'ps_src')
	})
	
	layout.append(vertexButton)
	layout.append(make('br'))
	layout.append(pixelButton)
	
	return layout
}

FromMeshCustomShader.prototype.connection_changed = function(on, conn, slot) {
	if (!on && slot.type === E2.slot_type.input) {
		if(slot.index === 0)
			this.shader = null
	}
}

FromMeshCustomShader.prototype.rebuild_shader = function() {
	var u_vs = [];
	var u_ps = [];
	var st = this.state;
	var gl = this.gl;
	var dts = this.core.datatypes;
	var that = this;

	for(var ident in st.slot_ids) {
		var dt = '';
		var slot = st.slot_ids[ident];
		var dtid = slot.dt.id;
		
		if(dtid === dts.FLOAT.id)
			dt = 'float';
		else if(dtid === dts.TEXTURE.id)
			dt = 'sampler2D';
		else if(dtid === dts.COLOR.id)
			dt = 'vec4';
		else if(dtid === dts.MATRIX.id)
			dt = 'mat4';
		else if(dtid === dts.VECTOR.id)
			dt = 'vec3';
		
		u_vs.push('uniform ' + dt + ' ' + ident + ';');
		u_ps.push('uniform ' + dt + ' ' + ident + ';');
	}

	function onCompiled(which) {
		return function(err) {
			that.updated = that.dirty = false;

			if (!that._editors || !that._editors[which])
				return;

			var ace = that._editors[which].getAce()
			ace.getSession().clearAnnotations()

			if (!err)
				return;

			console.warn('shader', which, 'errors', err)

			ace.getSession().setAnnotations(err)
		}
	}

	this.shader = ComposeShader(null, this.mesh, this.material,
		u_vs, u_ps,
		st.vs_src && st.changed ? st.vs_src : null, 
		st.ps_src && st.changed ? st.ps_src : null,
		onCompiled('vertex'),
		onCompiled('pixel'));

	if (this.shader.linked) {
		for(var ident in st.slot_ids) {
			var slot = st.slot_ids[ident]
			slot.uniform = gl.getUniformLocation(this.shader.program, ident)
		}
	
		this.shader.apply_uniforms_custom = function(self) { return function()
		{
			var tex_slot = 1;
			var sd = self.slot_data;
			var dts = self.core.datatypes;
		
			for(var ident in st.slot_ids)
			{
				var slot = st.slot_ids[ident];
		
				if(slot.uniform === null || sd[slot.id] === undefined || sd[slot.id] === null)
					continue;
				
				var dtid = slot.dt.id;
			
				if(dtid === dts.FLOAT.id)
					gl.uniform1f(slot.uniform, sd[slot.id]);
				else if(dtid === dts.TEXTURE.id)
				{
					gl.uniform1i(slot.uniform, tex_slot);
					sd[slot.id].enable(gl.TEXTURE0 + tex_slot);
					tex_slot++;
				}
				else if(dtid === dts.COLOR.id)
					gl.uniform4fv(slot.uniform, sd[slot.id]);	
				else if(dtid === dts.MATRIX.id)
					gl.uniformMatrix4fv(slot.uniform, false, sd[slot.id]);
				else if(dtid === dts.VECTOR.id)
					gl.uniform3fv(slot.uniform, sd[slot.id]);	
			}
		}}(this);
	}
	
	if(st.vs_src === '')
		st.vs_src = this.shader.vs_c_src;

	if(st.ps_src === '')
		st.ps_src = this.shader.ps_c_src;
};

FromMeshCustomShader.prototype.update_input = function(slot, data)
{
	if(slot.uid === undefined)
	{
		if(slot.index === 0)
		{
			if(this.mesh !== data)
			{
				this.mesh = data;
				this.dirty = true;
			}
		}
		else if(slot.index === 1)
		{
			this.material = data;
		}
	}
	else
	{
		this.slot_data[slot.uid] = data;
	}
};

FromMeshCustomShader.prototype.update_state = function()
{
	if(!this.mesh)
		return;
	
	var caps = Material.get_caps_hash(this.mesh, this.material);

	if(!this.dirty && this.caps_hash === caps)
	{
		if (this.shader)
			this.shader.material = this.material;
		return;
	}
	
	if(this.dirty || this.caps_hash !== caps)	
		this.rebuild_shader();

	this.caps_hash = caps;
	this.updated = true;
	this.dirty = false;
};

FromMeshCustomShader.prototype.update_output = function(slot)
{
	return this.shader;
};

FromMeshCustomShader.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.mesh = null;
		this.material = null;
		this.caps_mask = '';
		this.dirty = false;
	}
	else
	{
		this.core.add_aux_script('ace/src-noconflict/ace.js');
	}
};

})();

