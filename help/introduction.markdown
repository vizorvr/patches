<link href="style.css" rel="stylesheet"></link>

#<span style="font-family: 'Exo', sans-serif;">visualTHING&#8482;</span>
Updated June 1st 2012.

###Tested browsers:
Chrome + Firefox on OSX, Linux, Win7
		
###Known bugs:
Loading the page without the www prefix in the url, you will get security errors
and scenes will not load. So always use http://www.effekts.dk/poc - not http://effekts.dk/poc
  
###Editing:
- Right click on the grey canvas to insert plugins.
- CTRL-C + CTRL-V + CTRL-X --- Copy, Paste, Cut (on OSX also with CTRL, not CMD)
- Select + Multiselect plugins with mouse.

###Deleting plugins and connections:
Mouseover a plugin, connection or a selection, and hold SHIFT.
Things marked with red hover effect will be deleted on mouseclick.


###The info box:
When you mouseover plugins or connections, info about them will appear to the info box
in the lower left bottom of the screen. Not all plugins and connections have this info yet,
but we are completing them as the project advances.

###Saving & Loading:
When you hit "Save" button, text file will appear into the lower right textbox.
This is your saved graph, in JSON format. You can copy it from there and save as a file
on your computer. Also it's easy to just send it through a chat or e-mail.

Similarly, paste a previously saved JSON file into the save-textbox and hit load.


###The Graph Tree
The upper left column shows your graphs and subgraphs. The main graph is "Root". You can create
a new subgraph from the right-click menu -"Structure/Graph". Name your subgraph and you will
see it in the graph tree. Clicking on it from the graph tree will show you the contents.


###Input & Output proxies:
In the right click menu, under "Structure" you find plugins called "Input proxy" and 
"Output proxy". These can be used to promote input and output slots to a previous graph 
level. This is useful for creating clear control systems in complex graphs.


##Textures:
These are located in the **/data/textures/** folder. The filenames give you
a good idea of what they are.

The .jpg's are mostly 1024x1024px and the .png's all have some kind of
transparent element in them.

`
	alpha_blackbars.png
	alpha_light.png
	backdrop_landscape.jpg
	backdrop_orange.jpg
	backdrop_pearls.jpg
	backdrop_darkgrey.jpg
	backdrop_smoke.jpg
	cutout_fruit.png
	cutout_costello.png
	cutout_smiley1.png
	cutout_asterisk.png
	cutout_butterfly1.png
	cutout_butterfly2.png
	cutout_butterfly3.png
	cutout_butterfly4.png
	cutout_butterfly5.png
	cutout_orchid2.png
	cutout_orchid1.png
	cutout_audrey5.png
	cutout_audrey4.png
	cutout_audrey3.png
	cutout_audrey2.png
	cutout_audrey1.png
	looping_oak.jpg
	looping_tundra.jpg
	looping_lava.jpg
	looping_morse.jpg
	looping_wood.jpg
	looping_fuzz.jpg
	overlay_petals.jpg
	overlay_newspaper.png
	overlay_rainbow.jpg
	overlay_paper.jpg
	overlay_cardboard.jpg
	overlay_leather.jpg
	indus.jpg
	portrait.png
	bacon.jpg
`
 
##3D Scenes:
(Must be referred to by their 'scene.json file', for example
'http://www.effekts.dk/poc/data/scenes/roma/scene.json')

<table style="padding: 10px">
	<tr>
		<td style="width: 200px; text-align: center"><b>Relative filename</b></td>
		<td style="text-align: center"><b>Content</b></td>
	</tr>
	<tr>
		<td>/scenes/roma.json</td>
		<td>a model of cluster of buildings</td>
	</tr>
	<tr>
		<td>/scenes/coke.json</td>
		<td>simple texturemapped coke can</td>
	</tr>
	<tr>
		<td>/scenes/heineken.json</td>
		<td>simple texturemapped heineken can</td>
	</tr>
	<tr>
		<td>/scenes/sansabak.json</td>
		<td>a power plant model</td>
	</tr>
</table>

  
##Example JSON files:
<a href="examples/scene-viewer-example.json">scene-viewer-example.json</a>

A heavily annotated example that demonstrates how to contruct a mouse controlled
scene viewer that - amongst other things - auto-fits the scene to the camera setup,
uses the sample-and-hold and toggle plugins to implement complex control 
schemes, uses delta and acumulator combinations to maintain state and many other
tricks.
 
<a href="examples/render-to-texture-example.json">render-to-texture-example.json</a>

Any nested graph can now be rendered to a texture instead of the frame
buffer. The graph plugin has a new static output slot that, when
connected provides the enclosed logic rendered to a 512x512 texture. If
left unconnected, the graph will render to the graph in the same way it
has been so far.

Unlike the frame buffer, a render target is not automatically cleared -
create a fullscreen quad to do so. This allow us to accumulate values in
the texture. In this example this is leveraged to fade the current
buffer on each update, thus slowly fading it out while continuously
drawing a partially transparent texture mapped onto a sphere into it.

The example comes pre-configured with plenty of buttons and sliders
allowing for immediate tinkering.


<a href="examples/noise-overlay-example.json">noise-overlay-example.json</a>

Demonstrates random number generation, shown here in conjunction with
the new texture transform capabilities of the texture shader to use
noise maps for extra spice. A couple of neat tricks are demonstrated
here, for example the use of the Square oscillator to flip the texture
on the x/y axis at random to maximize variation.

Scale can be adjusted.

<a href="examples/mouse-input-example.json">mouse-input-example.json</a>

Demonstrates responding to mouse movement over and outside the canvas as
well as button presses on the canvas. This example is set up so that the
mouse position maps directly to translation and so that the left / right
mouse buttons invert the x/y scale respectively.


<a href="examples/texture-transforms-example.json">texture-transforms-example.json</a>

Similar the mouse input example, but includes rotation and manual control.
