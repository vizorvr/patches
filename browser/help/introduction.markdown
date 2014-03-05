<link href="style.css" rel="stylesheet"></link>

#<span style="font-family: 'greyscale_basic_regular', sans-serif;">E N G I</span>

###Tested browsers:
Chrome + Firefox on OSX, Linux, Win7
  
###Editing:
- Right click on canvas to insert plugins.
- CTRL-C + CTRL-V + CTRL-X --- Copy, Paste, Cut (on OSX also with CTRL, not CMD)
- Select and multiselect plugins with mouse.
- To delete plugins & connections hold SHIFT and mouseover them. Click & hold to delete.
- Navigate into subgraphs by selecting them in the graphtree on the left or clicking 
their 'edit' button.
- The draw order of subgraphs is determined by the creation order, but order can be 
rearranged by dragging the graph in the graphview on the left to another relative placement
within its parent. Subgraphs in a higher location gets rendered before graphs futher down
in each graph
- Press CTRL+b to (un)minimize the graph, info and log view to get more graph editing space.
- Click the icon of any node to (un)iconify it.

###The info box:
On the bottom left of the screen is an info box. Mouse-over nodes to see plugin info 
and over each slot to see individual slot descriptions.

###Snippets:
These are pre-made modules you can use to get stuff happening quickly. Select
a snippet from the list and press "Add" to add it to the graph you're currently editing.

###Saving & Loading graphs:
This is done in the Persistence-tab in the right side column. Hitting save will
generate a JSON file, which you can then copy and paste into your favorite text editor
and save to your harddisk. Graphs are loaded by pasting a suitable JSON snippet into the 
text field and clicking 'load' to erase the current graph and load the supplied one, or
click 'load to clipboard' to place the supplied graph in the paste buffer so it can be
pasted one or more times times into the current graph via CTRL+v.

###Advanced materials or rendering passes?
Write custom shaders. Many operations can be moved to the GPU and values can be transmitted 
from the graph to the shaders. For more information, refer to the
<a href="custom_shaders.html">custom shader documentation</a>.

###Need more functionality?
You can write your own plugins. For more information, refer to the
<a href="plugin_api.html">plugin API documentation</a>.

##Textures:
These are located in the **/data/textures/** folder. The filenames give you
a good idea of what they are.

The .jpg's are mostly 1024 x 1024px. All .png's contain transparent elements. Click on each to view it.

<a href="../data/textures/envmaps/skybox_1.jpg">envmaps/skybox_1.jpg</a><br/>
<a href="../data/textures/envmaps/skybox_2.gif">envmaps/skybox_2.gif</a><br/>
<a href="../data/textures/gradients/black-blue-white.png">gradients/black-blue-white.png</a><br/>
<a href="../data/textures/gradients/black-dark-blue-white.png">gradients/black-dark-blue-white.png</a><br/>
<a href="../data/textures/gradients/black-orange-white.png">gradients/black-orange-white.png</a><br/>
<a href="../data/textures/gradients/black-white.jpg">gradients/black-white.jpg</a><br/>
<a href="../data/textures/gradients/black-yellow-white.png">gradients/black-yellow-white.png</a><br/>
<a href="../data/textures/gradients/green-white.png">gradients/green-white.png</a><br/>
<a href="../data/textures/gradients/light-blue-shiny.jpg">gradients/light-blue-shiny.jpg</a><br/>
<a href="../data/textures/gradients/red-yellow-white.png">gradients/red-yellow-white.png</a><br/>
<a href="../data/textures/alpha_4lights.png">alpha_4lights.png</a><br/>
<a href="../data/textures/alpha_blackbars.png">alpha_blackbars.png</a><br/>
<a href="../data/textures/alpha_blackgrid.png">alpha_blackgrid.png</a><br/>
<a href="../data/textures/alpha_dot.png">alpha_dot.png</a><br/>
<a href="../data/textures/alpha_gradient1.png">alpha_gradient1.png</a><br/>
<a href="../data/textures/alpha_gradient2.png">alpha_gradient2.png</a><br/>
<a href="../data/textures/alpha_light.png">alpha_light.png</a><br/>
<a href="../data/textures/alpha_lines2.png">alpha_lines2.png</a><br/>
<a href="../data/textures/alpha_shadow.png">alpha_shadow.png</a><br/>
<a href="../data/textures/alpha_whitegrid.png">alpha_whitegrid.png</a><br/>
<a href="../data/textures/backdrop_blue.jpg">backdrop_blue.jpg</a><br/>
<a href="../data/textures/backdrop_darkgrey.jpg">backdrop_darkgrey.jpg</a><br/>
<a href="../data/textures/backdrop_grey2.jpg">backdrop_grey2.jpg</a><br/>
<a href="../data/textures/backdrop_landscape.jpg">backdrop_landscape.jpg</a><br/>
<a href="../data/textures/backdrop_lightgrey.jpg">backdrop_lightgrey.jpg</a><br/>
<a href="../data/textures/backdrop_orange.jpg">backdrop_orange.jpg</a><br/>
<a href="../data/textures/backdrop_pearls.jpg">backdrop_pearls.jpg</a><br/>
<a href="../data/textures/backdrop_red.jpg">backdrop_red.jpg</a><br/>
<a href="../data/textures/backdrop_smoke.jpg">backdrop_smoke.jpg</a><br/>
<a href="../data/textures/backdrop_stars2.jpg">backdrop_stars2.jpg</a><br/>
<a href="../data/textures/backdrop_stars.jpg">backdrop_stars.jpg</a><br/>
<a href="../data/textures/backdrop_typography2.jpg">backdrop_typography2.jpg</a><br/>
<a href="../data/textures/backdrop_typography3.jpg">backdrop_typography3.jpg</a><br/>
<a href="../data/textures/backdrop_typography4.jpg">backdrop_typography4.jpg</a><br/>
<a href="../data/textures/backdrop_typography.jpg">backdrop_typography.jpg</a><br/>
<a href="../data/textures/backdrop_typography_light2.jpg">backdrop_typography_light2.jpg</a><br/>
<a href="../data/textures/backdrop_typography_light.jpg">backdrop_typography_light.jpg</a><br/>
<a href="../data/textures/clouds.png">clouds.png</a><br/>
<a href="../data/textures/cutout_a_black.png">cutout_a_black.png</a><br/>
<a href="../data/textures/cutout_asterisk.png">cutout_asterisk.png</a><br/>
<a href="../data/textures/cutout_audrey1.png">cutout_audrey1.png</a><br/>
<a href="../data/textures/cutout_audrey2.png">cutout_audrey2.png</a><br/>
<a href="../data/textures/cutout_audrey3.png">cutout_audrey3.png</a><br/>
<a href="../data/textures/cutout_audrey4.png">cutout_audrey4.png</a><br/>
<a href="../data/textures/cutout_audrey5.png">cutout_audrey5.png</a><br/>
<a href="../data/textures/cutout_a_white.png">cutout_a_white.png</a><br/>
<a href="../data/textures/cutout_butterfly1.png">cutout_butterfly1.png</a><br/>
<a href="../data/textures/cutout_butterfly2.png">cutout_butterfly2.png</a><br/>
<a href="../data/textures/cutout_butterfly3.png">cutout_butterfly3.png</a><br/>
<a href="../data/textures/cutout_butterfly4.png">cutout_butterfly4.png</a><br/>
<a href="../data/textures/cutout_butterfly5.png">cutout_butterfly5.png</a><br/>
<a href="../data/textures/cutout_costello.png">cutout_costello.png</a><br/>
<a href="../data/textures/cutout_crazy.png">cutout_crazy.png</a><br/>
<a href="../data/textures/cutout_dots.png">cutout_dots.png</a><br/>
<a href="../data/textures/cutout_fractal1.png">cutout_fractal1.png</a><br/>
<a href="../data/textures/cutout_fractal.png">cutout_fractal.png</a><br/>
<a href="../data/textures/cutout_fruit.png">cutout_fruit.png</a><br/>
<a href="../data/textures/cutout_orchid1.png">cutout_orchid1.png</a><br/>
<a href="../data/textures/cutout_orchid2.png">cutout_orchid2.png</a><br/>
<a href="../data/textures/cutout_plane.png">cutout_plane.png</a><br/>
<a href="../data/textures/cutout_smiley1.png">cutout_smiley1.png</a><br/>
<a href="../data/textures/cutout_vogue1.png">cutout_vogue1.png</a><br/>
<a href="../data/textures/cutout_vogue2.png">cutout_vogue2.png</a><br/>
<a href="../data/textures/cutout_vogue3.png">cutout_vogue3.png</a><br/>
<a href="../data/textures/earth_clean.jpg">earth_clean.jpg</a><br/>
<a href="../data/textures/earth_clouds.jpg">earth_clouds.jpg</a><br/>
<a href="../data/textures/earth_night.jpg">earth_night.jpg</a><br/>
<a href="../data/textures/flare1.png">flare1.png</a><br/>
<a href="../data/textures/flare2.png">flare2.png</a><br/>
<a href="../data/textures/flare3.png">flare3.png</a><br/>
<a href="../data/textures/flare4.png">flare4.png</a><br/>
<a href="../data/textures/flare5.jpg">flare5.jpg</a><br/>
<a href="../data/textures/flare6.png">flare6.png</a><br/>
<a href="../data/textures/flare7.png">flare7.png</a><br/>
<a href="../data/textures/instance-distribution-map.jpg">instance-distribution-map.jpg</a><br/>
<a href="../data/textures/logo1.png">logo1.png</a><br/>
<a href="../data/textures/logo2.png">logo2.png</a><br/>
<a href="../data/textures/logo3.png">logo3.png</a><br/>
<a href="../data/textures/logo4.png">logo4.png</a><br/>
<a href="../data/textures/looping_art.jpg">looping_art.jpg</a><br/>
<a href="../data/textures/looping_bees.jpg">looping_bees.jpg</a><br/>
<a href="../data/textures/looping_black.jpg">looping_black.jpg</a><br/>
<a href="../data/textures/looping_fractal.jpg">looping_fractal.jpg</a><br/>
<a href="../data/textures/looping_fuzz.jpg">looping_fuzz.jpg</a><br/>
<a href="../data/textures/looping_lava2.jpg">looping_lava2.jpg</a><br/>
<a href="../data/textures/looping_lava3_green.jpg">looping_lava3_green.jpg</a><br/>
<a href="../data/textures/looping_lava3.jpg">looping_lava3.jpg</a><br/>
<a href="../data/textures/looping_lava.jpg">looping_lava.jpg</a><br/>
<a href="../data/textures/looping_morse.jpg">looping_morse.jpg</a><br/>
<a href="../data/textures/looping_oak.jpg">looping_oak.jpg</a><br/>
<a href="../data/textures/looping_sky.jpg">looping_sky.jpg</a><br/>
<a href="../data/textures/looping_tundra.jpg">looping_tundra.jpg</a><br/>
<a href="../data/textures/looping_wood.jpg">looping_wood.jpg</a><br/>
<a href="../data/textures/moon_bump.jpg">moon_bump.jpg</a><br/>
<a href="../data/textures/noise5.jpg">noise5.jpg</a><br/>
<a href="../data/textures/normal-lava.jpg">normal-lava.jpg</a><br/>
<a href="../data/textures/normal-map2.jpg">normal-map2.jpg</a><br/>
<a href="../data/textures/normal-map3.jpg">normal-map3.jpg</a><br/>
<a href="../data/textures/normal-map.jpg">normal-map.jpg</a><br/>
<a href="../data/textures/normal-rock.jpg">normal-rock.jpg</a><br/>
<a href="../data/textures/overlay_cardboard.jpg">overlay_cardboard.jpg</a><br/>
<a href="../data/textures/overlay_colors1.jpg">overlay_colors1.jpg</a><br/>
<a href="../data/textures/overlay_colors2.jpg">overlay_colors2.jpg</a><br/>
<a href="../data/textures/overlay_leather.jpg">overlay_leather.jpg</a><br/>
<a href="../data/textures/overlay_newspaper.png">overlay_newspaper.png</a><br/>
<a href="../data/textures/overlay_paper.jpg">overlay_paper.jpg</a><br/>
<a href="../data/textures/overlay_petals.jpg">overlay_petals.jpg</a><br/>
<a href="../data/textures/overlay_rainbow.jpg">overlay_rainbow.jpg</a><br/>
<a href="../data/textures/particle1.jpg">particle1.jpg</a><br/>
<a href="../data/textures/particle1.png">particle1.png</a><br/>
<a href="../data/textures/particle2.jpg">particle2.jpg</a><br/>
<a href="../data/textures/particle2.png">particle2.png</a><br/>
<a href="../data/textures/particle3.png">particle3.png</a><br/>
<a href="../data/textures/particle4.png">particle4.png</a><br/>
<a href="../data/textures/saskia_dancer1.png">saskia_dancer1.png</a><br/>
<a href="../data/textures/saskia_texture1.jpg">saskia_texture1.jpg</a><br/>
<a href="../data/textures/saskia_texture2.jpg">saskia_texture2.jpg</a><br/>
<a href="../data/textures/star3.png">star3.png</a><br/>
<a href="../data/textures/tile_arabictiling.jpg">tile_arabictiling.jpg</a><br/>
<a href="../data/textures/tile_grass.jpg">tile_grass.jpg</a><br/>
<a href="../data/textures/tile_grid.png">tile_grid.png</a><br/>
<a href="../data/textures/tile.jpg">tile.jpg</a><br/>
<a href="../data/textures/tile_lava.jpg">tile_lava.jpg</a><br/>
<a href="../data/textures/tile_metal.jpg">tile_metal.jpg</a><br/>
<a href="../data/textures/tile_pattern.jpg">tile_pattern.jpg</a><br/>
<a href="../data/textures/tile_spaceship.jpg">tile_spaceship.jpg</a><br/>
<a href="../data/textures/tile_wallpaper.jpg">tile_wallpaper.jpg</a><br/>
<a href="../data/textures/tile_wood2.jpg">tile_wood2.jpg</a><br/>
<a href="../data/textures/tile_wood.jpg">tile_wood.jpg</a><br/>
<a href="../data/textures/typography3.jpg">typography3.jpg</a><br/>
<a href="../data/textures/typography_engi.png">typography_engi.png</a><br/>
<a href="../data/textures/typography_longtext2.png">typography_longtext2.png</a><br/>
<a href="../data/textures/vignette.png">vignette.png</a><br/>
 
##3D Scenes:
These are the default scenes we are including at the moment. They must be referred to by their 'scene.json file', for example 'data/scenes/roma/scene.json'. If you have scenes or models you would like to include, please contact us.

<table cellpadding="2" width="890">
	<col width="350px" />
	<col />
	<tr>
		<td style="border-bottom: 1px solid #888"><b>Relative filename</b></td>
		<td style="border-bottom: 1px solid #888"><b>Content</b></td>
	</tr>
	<tr>
		<td><nobr>data/scenes/clementine/scene.json</nobr></td>
		<td>Character mesh</td>
	</tr>
	<tr>
		<td><nobr>data/scenes/dropship/scene.json</nobr></td>
		<td>Aliens dropship</td>
	</tr>
	<tr>
		<td><nobr>data/effekt/pixelby/scene.json</nobr></td>
		<td>Abstract mesh</td>
	</tr>
	<tr>
		<td><nobr>data/scenes/feisar/scene.json</nobr></td>
		<td>Ship from wipeout</td>
	</tr>
	<tr>
		<td><nobr>data/scenes/hummingbird/scene.json</nobr></td>
		<td>Lowpoly hummingbird</td>
	</tr>
	<tr>
		<td><nobr>data/scenes/jugi/scene.json</nobr></td>
		<td>Abstract geosphere.</td>
	</tr>
	<tr>
		<td><nobr>data/scenes/ladybug/scene.json</nobr></td>
		<td>Lowpoly ladybug</td>
	</tr>
	<tr>
		<td><nobr>data/scenes/macaba/scene.json</nobr></td>
		<td>Macaba building</td>
	</tr>
	<tr>
		<td><nobr>data/scenes/roadblock_1/scene.json</nobr></td>
		<td>Roadblock object</td>
	</tr>
	<tr>
		<td><nobr>data/scenes/roadblock_2/scene.json</nobr></td>
		<td>Another roadblock object</td>
	</tr>
	<tr>
		<td><nobr>data/scenes/skybox/scene.json</nobr></td>
		<td>Skybox</td>
	</tr>
	<tr>
		<td><nobr>data/scenes/statue/scene.json</nobr></td>
		<td>Classical statue</td>
	</tr>
	<tr>
		<td><nobr>data/scenes/tv/scene.json</nobr></td>
		<td>A television</td>
	</tr>
</table>
