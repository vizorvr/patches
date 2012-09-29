E2.plugins["default_material"] = function(core, node) {
	var self = this;
	
	this.desc = 'Create a default matrial with the following properties:\nAlpha clip: false\nDepth test: true\nDepth write: true\nDepth function: Less than or equal.\nShininess (specularity): 0\nDouble-sided: false\nBlend mode: Normal\nDiffuse color: White, full alpha, Ambient color: 0.2, 0.2, 0.2';
	this.input_slots = [];
	this.output_slots = [ { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The resulting default material.' } ];
	
	this.reset = function()
	{
		self.material = new Material();
	};
	
	this.update_output = function(slot)
	{
		return self.material;
	};
};
