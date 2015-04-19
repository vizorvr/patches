E2.p = E2.plugins.vr_camera_info_generator = function(core, node)
{
	this.desc = 'Supplies left / right FOV and translation of the current VR device camera.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'left FOV', dt: core.datatypes.FLOAT, desc: 'Left eye FOV.', def: 75 },
		{ name: 'right FOV', dt: core.datatypes.FLOAT, desc: 'Right eye FOV.', def: 75 },
		{ name: 'left offset', dt: core.datatypes.FLOAT, desc: 'Left eye translation.', def: 0.0 },
		{ name: 'right offset', dt: core.datatypes.FLOAT, desc: 'Right eye translation.', def: 0.0 }
	];
	
	this.renderer = core.renderer;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.update_output = function(slot) {
	var hmd = this.renderer.vr_hmd;
	var defaultEye = {
		eyeTranslation: 0.0,
		recommendedFieldOfView: {
			leftDegrees: 75,
			rightDegrees: 75
		}
	}
	var eyeL = defaultEye, eyeR = defaultEye
	
	if (hmd) {
		if (hmd.getEyeParameters !== undefined) {
			eyeL = hmd.getEyeParameters('left')
			eyeR = hmd.getEyeParameters('right')
		} else {
			eyeL = {
				eyeTranslation: hmd.getEyeTranslation('left'),
				recommendedFieldOfView: hmd.getRecommendedEyeFieldOfView('left')
			}
			eyeR = {
				eyeTranslation: hmd.getEyeTranslation('right'),
				recommendedFieldOfView: hmd.getRecommendedEyeFieldOfView('right')
			}
		}
	}

	if (slot.index === 0)
		return eyeL.recommendedFieldOfView.leftDegrees
	else if (slot.index === 1)
		return eyeR.recommendedFieldOfView.rightDegrees
	else if (slot.index === 2)
		return eyeL.eyeTranslation
		
	return eyeR.getEyeTranslation
};
