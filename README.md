Engi
====

Engi is a HTML5/WebGL-compliant [dataflow programming](https://en.wikipedia.org/wiki/Dataflow_programming) editor.

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

Engi currently has approximately 200 plugins that provide functionality including but not limited to 
the following:

Ways to obtain or create data:

* Cameras: Perspective, orthographic and screen space.
* Input: Keyboard, mouse position, button state and scroll wheel.
* Loading assets: HTML5 audio, images, JSON, 3d scenes and HTML5 video.
* Matrices: Translation, rotation, scale and planar projection.
* Meshes: Cube, grid, null (transform visualization), particles, quad and sphere.
* Shaders: Diffuse only, automatic from mesh, user-specified, normal as color and texture with UV-transforms.
* System state: Initialized, assets started, failed, and successfully loaded.
* Text rendering.
* Time: Absolute, frame delta.
* Typed arrays.
* Various plugins to provide UI for direct manipulation or input of values: Knobs, sliders, input 
  fields for labels and constant values, toggle and action buttons, color pickers, text editors and 
  many other similar things.

Ways to modify data:

* Audio: Get duration and current playback position.
* Color: Add, mix, multiply and set alpha.
* Data type conversions.
* Filters: First order low pass, sample and hold, toggle.
* Instanced meshes: Clear transforms, rotate, scale, translate.
* Light sources (point, directional): Diffuse color, direction, intensity, position, specular color and type.
* Logic: And, equals, if, if...else, less than, more than, nand, not, or, switch and xor.
* Materials: Alpha clip, ambient color, blend mode (none, add, sub, mul, normal), diffuse color, double sided,
  attach lights, shininess, textures (diffuse, emission, specular and normal maps), z-buffer (use / write).
* Math: Add, clamp, divide, module, multiply, negate, subtract, delta, abs, cos, exp, log, max, min, sin,
  sqrt, tan, ceil, floor and round.
* Matrix: Concatenate, get component, invert, set component and transpose.
* Mesh: Primitive type (points, lines, line strip, line loop, triangles, tristrip, trifan).
* Object: Convert named member to typed array.
* Oscillators: Cosine, sawtooth, sine, square, triangle.
* Scene: Get bounding box, get mesh, get mesh count.
* String: Concatenate, parse JSON.
* Tweens: In / out (circular, cubic, exponential, quadratic, quartic, quintic and sinusoidal).
* Typed arrays: Array to mesh, array to texture, get element, get element as type, length, set element,
  set element as type.
* Vector: Add, cross, dot product, magnitude, multiply, normalize, scale and transform.
* Video: Current time and duration.

Ways to use data:

* 3D: Render scene, render mesh, create instanced meshes (arrays, cubic volumes, using iterated function
  systems or distribution textures) and record the current framebuffer.
* Audio: Player.
* Debug visualization: On-canvas visualization of booleans, colors, arbitrary data, floats, matrices, function
  plots, text and vectors.
* Sequencing: Stop playback.
* Video: Player.

Created sequences can be im- and exported as human (or machine) readable JSON files, which can be
embedded into any context the user may desire with the included stand-alone player or simulated in a bare core
instance, which permits sequences to be leveraged in other javascript projects as a domain specific visual
scripting language by providing the embedded graph with appropriate values from its host, updating the graph
and acting on the emitted output values.

# Running Engi

Install [Node.js](http://nodejs.org/), then the required npm packages:

	$ npm install

Run the server:

	$ node server.js [/optional/path/to/existing/project]

Open Engi in the browser:

	http://localhost:8000/

