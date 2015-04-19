E2.p = E2.plugins["vr_camera_modulator"] = function(core, node)
{
	this.desc = 'Modifies the supplied camera to conform to the current VR HMD.';
	
	this.input_slots = [
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'The input camera to modify for VR use.' }
	];
	
	this.output_slots = [
		{ name: 'left camera', dt: core.datatypes.CAMERA, desc: 'The left eye camera.' },
		{ name: 'right camera', dt: core.datatypes.CAMERA, desc: 'The right eye camera.' }
	];
	
	this.renderer = core.renderer;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.camera = data;
}

E2.p.prototype.update_state = function()
{
		var eyeL, eyeR

	this.camera_l.view = mat4.create(this.camera.view);
	this.camera_r.view = mat4.create(this.camera.view);

	var fov2scaleofs = function(fov)
	{
		var pxscale = 2.0 / (fov.leftTan + fov.rightTan);
		var pxoffset = (fov.leftTan - fov.rightTan) * pxscale * 0.5;
		var pyscale = 2.0 / (fov.upTan + fov.downTan);
		var pyoffset = (fov.upTan - fov.downTan) * pyscale * 0.5;
		
		return {
		    scale: [pxscale, pyscale],
		    offset: [pxoffset, pyoffset]
		};
    };
	
	var fov2proj = function(m, fov, near, far)
	{
		var hs = -1.0;
		var so = fov2scaleofs({
			upTan: Math.tan(fov.upDegrees * Math.PI / 180.0),
			downTan: Math.tan(fov.downDegrees * Math.PI / 180.0),
			leftTan: Math.tan(fov.leftDegrees * Math.PI / 180.0),
			rightTan: Math.tan(fov.rightDegrees * Math.PI / 180.0)
		});
		
		m[0] = so.scale[0];
		m[1] = 0.0;
		m[2] = so.offset[0] * hs;
		m[3] = 0.0;
		m[4] = 0.0;
		m[5] = so.scale[1];
		m[6] = -so.offset[1] * hs;
		m[7] = 0.0;
		m[8] = 0.0;
		m[9] = 0.0;
		m[10] = far / (near - far) * -hs;		
		m[11] = /*(far * near) / (near / far)*/-0.02; // TODO: Find out just what the fuck.
		m[12] = 0.0;
		m[13] = 0.0;
		m[14] = hs;
		m[15] = 0.0;
		
		mat4.transpose(m);
	};
	
	var hmd = this.renderer.vr_hmd;

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

		var et = eyeL.eyeTranslation
		var ipd = vec3.length(vec3.create([et.x, et.y, et.z]));
		
		fov2proj(this.camera_l.projection, eyeL.recommendedFieldOfView, 0.01, 10000.0);
		fov2proj(this.camera_r.projection, eyeR.recommendedFieldOfView, 0.01, 10000.0);
		
		mat4.translate(this.camera_l.view, vec3.create([-ipd, 0.0, 0.0])); 
		mat4.translate(this.camera_r.view, vec3.create([ipd, 0.0, 0.0]));
	}
	else
	{
		this.camera_l.projection = mat4.create(this.camera.projection);
		this.camera_r.projection = mat4.create(this.camera.projection);
	}
};

E2.p.prototype.update_output = function(slot)
{
	if(slot.index === 0)
		return this.camera_l;
	
	return this.camera_r;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.camera = new Camera();
		this.camera_l = new Camera();
		this.camera_r = new Camera();
	}
};
