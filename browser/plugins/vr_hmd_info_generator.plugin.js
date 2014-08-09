E2.p = E2.plugins["vr_hmd_info_generator"] = function(core, node)
{
	this.desc = 'Supplies various information about the current VR HMD device.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'device name', dt: core.datatypes.TEXT, desc: 'The active VR device name.', def: '' },
		{ name: 'display width', dt: core.datatypes.FLOAT, desc: 'The HMD display width in pixels.', def: 0 },
		{ name: 'display height', dt: core.datatypes.FLOAT, desc: 'The HMD display height in pixels.', def: 0 },
		{ name: 'render width', dt: core.datatypes.FLOAT, desc: 'The HMD render target width in pixels.', def: 0 },
		{ name: 'render height', dt: core.datatypes.FLOAT, desc: 'The HMD render target height in pixels.', def: 0 }
	];
	
	this.renderer = core.renderer;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.update_output = function(slot)
{
	var hmd = this.renderer.vr_hmd;
	
	if(slot.index === 0)
		return hmd ? hmd.deviceName : '';
	else if(slot.index === 1)
		return hmd ? hmd.displaySize.width : 0;
	else if(slot.index === 2)
		return hmd ? hmd.displaySize.height : 0;
	else if(slot.index === 3)
		return hmd ? hmd.renderTargetSize.width : 0;
	
	return hmd ? hmd.renderTargetSize.height : 0;
};
