————————————————————
	Archontis Politis, 7/2017
	archontis.politis@gmail.com
————————————————————

The ambisonics.umd.js is the bundled version of the browser-based JSAmbisonics Web Audio library found at https://github.com/polarch/JSAmbisonics. A number of Vizor plugins have ben made to expose the functionality of the library inside Vizor. For more details on Ambisonics, 360-audio, ambisonic panning, ambisonic decoding, etc. please check the documentation of the JSAmbisonics library and the referenced conference publication. For a better understanding on their usage see the Vizor graph examples found in /data/graphs/ambisonics.

The Vizor plugins at the moment are the following:

"FOAmbisonic encoder" [audio_ambisonic_foaencoder.json]:

A first-order ambisonic (FOA) encoder that takes a mono input audio stream along with a prescribed direction, and outputs the resulting 4-channel ambisonic audio stream. The direction should be given as a cartesian vector (unit or not).

"FOAmbisonic mirror": [audio_ambisonic_foamirror.json]:

A first-order ambisonic (FOA) mirror that takes a 4-channel ambisonic audio stream (FOA) and is able to mirror its spatialization across the principal planes (xy, yz, zx). Check the “mirror_plane” input slot pop-up for which integer you should pass for each mirror plane.

"FOAmbisonic converter": [audio_ambisonic_foaconverter.json]:

Ambisonics have a few different format conventions in practice. JSAmbisonics does all the processing using internally the N3D/ACN convention. However it is useful to be able to convert from one convention to another to handle different material. For example most available 360-audio recordings are in the older FOA format of WXYZ (or also called FuMa). The converter plugin can convert other formats to ACN/N3D. An integer should be passed to the “convention” input slot, with “0” being ACN/N3D (used by MPEG-H), “1” being the traditional WXYZ/FuMA (almost all available recordings), and “2” being the ACN/SN3D (used by the AmbiX format, and Youtube).

"FOAmbisonic rotator": [audio_ambisonic_foarotator.json]:

Ambisonics can very efficiently rotate the ambisonic recording, e.g. according to the listener’s head orientation if tracked by a VR device, so that the sound scene stays stable when listening to headphones. That can be done with the rotator plugin, by passing a camera rotation vector to the “rotation” input slot.

"FOAmbisonic decoder": [audio_ambisonic_foadecoder.json]:

This plugin should always go to the end of the chain of ambisonic plugins (encoders, mirrors, rotators etc..) since it converts the ambisonic audio stream to binaural for listening with headphones. Specific filters should be passed to the decoder to do that conversion - some examples are included in /data/audio/ambisonics/filters. These should be passed as an audio buffer in the “buffer” input slot. You can use Vizor’s audio buffer loader plugin for that purpose. The output of the decoder can be connected to the normal stereo audio-out plugin of Vizor.

"FOAmbisonic virtual mic": [audio_ambisonic_foavmic.json]:

In Ambisonics there is a way to create an acoustic focus towards a certain direction, called often a virtual microphone. This plugin does that. It takes an ambisonic 4-channel audio stream and outputs a mono stream, the result of the virtual microphone. Its focusing direction can be controlled, and also its shape. Since FOA are quite low resolution, the effect can be quite subtle. For more aggressive focusing one has to use higher-order Ambisonics, such as the included third-order (TOA) plugins. Its look-direction can be controlled with passing a direction vector (unit or not), and its shape by passing an integer to the “mic_type” input slot (0:cardioid, 1:supercardioid, 2:hypercardioid).


The third-order (TOA) plugins work in exactly the same way as the FOA ones, but they require third-order ambisonic streams of 16-channels, they are heavier and much more sharp in spatial resolution. One problem with the TOA plugins is that both recordings and filters are 16-channels, and the Web-Audio buffer loader messes up multichannel files of that many channels. It seems to work ok with 8-channel files though. So a 16-channel file has to be split up into two 8-channel ones and loaded in two parts. A solution has been provided by the 

"TOAmbisonic buffer merger": [audio_ambisonic_buffermerger.json]

which takes two 8-channel audio buffers, loaded normally with Vizor’s audio buffer loader, and combines them to a 16-channel one. That should be done for example to load a 16channel recording for playback with the decoder plugin, for focusing with the virtual microphone plugin, etc. Also the binaural filters that should be passed to the decoder are also 16-channel ones (examples in /data/audio/ambisonics/filters) and they should be loaded in parts, combined and passed to the decoder. Another important point is that Web Audio messes up the channel order of 8-channel files, if they are in OGG format. There is no problem if they are WAV files, but then size can quickly get out of hand with that many channels and no audio compression. This order issue can be fixed for OGG files if the integer “1” is passed to the “filetype” input slot of the merger plugin (or “0” for WAV files).

The rest of the TOA plugins are:

"TOAmbisonic encoder": 	[audio_ambisonic_toaencoder.json]
"TOAmbisonic decoder": 	[audio_ambisonic_toadecoder.json]
"TOAmbisonic rotator": 	[audio_ambisonic_toarotator.json]
"TOAmbisonic mirror": 		[audio_ambisonic_toamirror.json]
"TOAmbisonic converter": 	[audio_ambisonic_toaconverter.json]
"TOAmbisonic virtual mic": 	[audio_ambisonic_toavmic.json]




