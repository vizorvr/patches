Engi
====

Engi is a HTML5/WebGL-compliant [dataflow programming](https://en.wikipedia.org/wiki/Dataflow_programming) editor.

Try a live demo at [engijs.org](http://engijs.org).

# Introduction

By routing data between nodes in a directed acyclic graph, arbitrary logic can be constructed. This is a 
particularly effective approach for rapid prototyping or creative exploration when compared with more 
traditional modes of programming. The editor is fully featured and comes with live preview, data flow
visualization, structural view, dynamic on-demand documentation, copy/cut/paste, persistence and
a catalog of snippets that can be used as examples or modular building blocks for more complex logic.

To structure larger projects, logic can be nested in sub-graphs which can receive and emit data via
named proxy nodes. Logic in nested graphs can be either rendered directly or optionally to a render target, which 
can subsequently be used as a normal texture. Loops are modeled as nested graphs that are evaluated once
per loop iteration.

Engi currently has approximately 210 plugins that provide functionality including but not limited to 
the following:

Ways to obtain or create data:

* Cameras: Perspective, orthographic and screen space. Obtain aspect radio and viewport size.
* Crypto: Check the current balances of a named CounterWallet.
* Input: Keyboard, mouse position, button state and scroll wheel.
* Loading assets: HTML5 audio, images, JSON, 3d scenes and HTML5 video. Select files directly from UI or provide URLs to load as strings from the graph.
* Matrices: Translation, rotation, scale and planar projection.
* Meshes: Cube, grid, null (transform visualization), plane, quad, sphere and user defined (Blender exporter is included).
* Open Sound Control: Receive float / xy float.
* Shaders: Diffuse only, automatically generated from mesh and material, user defined, normal as color and texture with UV-transforms.
* System state: Initialized, assets started, failed, and successfully loaded. Graphs can emit these signals 
  via plugins to integrate with the global asset load logic when procedurally generating data.
* Text rendering.
* Time: Absolute, frame delta.
* Typed array generation.
* Virtual Reality: Camera / MHD / Sensor info. Sensor velocity / acceleration. Full Oculus Rift support.
* Various plugins to provide UI for direct manipulation or input of values: Knobs, sliders, input 
  fields for labels and constant values, toggle and action buttons, color pickers, text editors, 
  PRNGs and many other similar plugins for providing data directly from the graph view.

Ways to modify data:

* Audio: Get duration and current playback position. Analysis (FFT), gain, buffer source.
* Color: Add, mix, multiply and set alpha.
* Data type conversions. Format or parse strings, compose complex types from primitives, convert 
  between primitive types and split / merge cameras to / from constituent matrices.
* Curves: Looping cubic interpolation of keypoints.
* Filters: First order low pass, sample and hold, toggle.
* Instanced meshes: Clear transforms, rotate, scale, translate.
* Light sources (point, directional): Diffuse color, direction, intensity, position, specular color and type.
* Logic: And, equals, if, if...else, less than, more than, nand, not, or, switch and xor.
* Materials: Alpha clip, ambient color, blend mode (none, add, sub, mul, normal), diffuse color, double sided,
  attach lights, shininess, textures (diffuse, emission, specular and normal maps), z-buffer (use / write).
* Math: Add, clamp, divide, module, multiply, negate, subtract, delta, abs, cos, exp, log, max, min, sin,
  sqrt, tan, ceil, floor and round.
* Matrix: Concatenate, get component, invert, set component and transpose.
* Mesh: Primitive type (points, lines, line strip, line loop, triangles, tristrip, trifan). Obtain or set the maximum primitive count to render.
* Object: Convert named member to float, bool, string, object or typed array. Access any array item of the
  those same types by index and object member name.
* Oscillators: Cosine, sawtooth, sine, square, triangle.
* Scene: Get bounding box, get mesh, get mesh count.
* String: Concatenate, parse JSON.
* Tweens: In / out (circular, cubic, exponential, quadratic, quartic, quintic and sinusoidal).
* Typed arrays: Array to mesh, array to texture, get element, get element as type, length, set element,
  set element as type.
* Virtual Reality: Create Oculus Rift compatible left / right camera from an input camera.
* Vector: Add, cross, dot product, magnitude, multiply, normalize, scale and transform.
* Video: Current time and duration.

Ways to use data:

* 3D: Render scene, render mesh, create instanced meshes (arrays, cubic volumes, using iterated function
  systems or distribution textures) and record the current framebuffer.
* Audio: Player / Source player.
* Debug visualization: On-canvas visualization of booleans, colors, arbitrary data, floats, matrices, objects,
  function plots, text and vectors.
* Sequencing: Stop playback.
* Video: Player.

Ways to structure logic or store state:

* Create infinitely nested sub-graphs or loops.
* Create named in- and output proxies in a graph to have them automatically reflected as a slot on the parent node of the graph the proxy is in.
* Create named registers to store values of any supported data type between graph updates as state storage or feedback loops.

Created sequences can be im- and exported as human (or machine) readable JSON files, which can be
embedded into any context the user may desire with the included stand-alone player or simulated in a bare core
instance, which permits sequences to be leveraged in other javascript projects as a domain specific visual
scripting language by providing the embedded graph with appropriate values from its host, updating the graph
and acting on the emitted output values. Created sequences can be automatically exported to an
optimized file set, ready to deploy to any webserver.

# Running Engi

Install [Node.js](http://nodejs.org/), then the required npm packages:

	$ npm install

Run the server:

	$ node server.js [/optional/path/to/existing/project]

Open Engi in the browser:

	http://localhost:8000/
	
If you have access to an Oculus Rift DK1 or 2 and want to play with the VR features, you currently
need one of Toji's special Chromium builds. You can find them here: http://blog.tojicode.com/2014/07/bringing-vr-to-chrome.html

