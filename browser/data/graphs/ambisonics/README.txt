————————————————————
	Archontis Politis, 7/2017
	archontis.politis@gmail.com
————————————————————

These Vizor graphs demonstrate the main functionality of the Ambisonics plugins in practice.
To load them into the Vizor editor, copy the code of each json file and paste it into the editor window.
The FOA plugins are meant to be handling first-order Ambisonics, and they are lightweight, but quite blurry spatially (a problem of first-order Ambisonics, not of the plugins). The TOA plugins are meant for sharp spatialization, but they are heavier. Their usage is the same. Examples are provided for both categories.

- FOA/TOApanner-example: This is a simple patch loading a sound that the user wants to spatialize. The sound can be spatialized using the sliders that move it horizontally, and in elevation.

- FOA/TOApanner-example-with-camera: This is the same as above, but in a normal case apart from spatializing the sound the user may want to rotate their view, or see the scene in VR. In this case both position of the sound, and rotation of the camera should be taken into account. This example attaches the rotation of the sound scene to the rotation of the camera. 

- FOA/TOAplayer: Ambisonics are able to playback 360-audio captures with special microphones. Most available ambisonic recordings are first-order (FOA) with 4 channels of audio. Playback of these spatial recordings can be done with ambisonic decoding. This patch demonstrates such playback for headphones. FOA recordings are found in a format convention called WXYZ or FuMa, which corresponds to passing “1” to the “convention” input of the FOAplayer module. If higher-order recordings are available, one should pass 0 instead (ACN/N3D - MPEG-H), or 2 (ACN/SN3D - Youtube, AmbiX).

- FOA/TOAplayer-example-with-camera: This is the same as above, but again now the user can rotate the view and the whole spatial recording is rotated appropriately so that it stays stable.

- FOA/TOAvirtualmic-example: In Ambisonics there is a way to create an acoustic focus towards a certain direction, called often a virtual microphone. The plugin used here does that. Its focusing direction can be controlled, and also its shape (ranging from cardioid to supercardioid to hypercardioid). Since FOA are quite low resolution, the effect can be quite subtle. For more aggressive focusing one has to use higher-order Ambisonics, such as the included third-order (TOA) plugins.

- FOA/TOAplayer-360audio-with-video: Ambisonics are a natural fit for 360 video because they can play back 360 audio that has been recorded with the video, and they can easily rotate the recording according to the listener’s head during playback. This example demonstrates simultaneous playback of a 360-video and 360-audio.
