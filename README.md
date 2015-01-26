# Vizor Create
====

Vizor Create is a visual programming tool for WebGL, WebVR and other HTML5 APIs. 

**Use Vizor Create online at [create.vizor.io](http://create.vizor.io)!**

Be sure to read the [Help documentation](http://create.vizor.io/help/introduction.html), the [Plugin API docs](http://create.vizor.io/help/plugin_api.html) (subject to change).

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

Vizor Create currently has approximately 260 plugins that provide functionality including but not limited to
the following:

Ways to obtain or create data:

* Cameras: Perspective, orthographic and screen space. Obtain aspect radio and viewport size.
* Input: Gamepad, VR headset, keyboard, mouse position, button state and scroll wheel.
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
* Web Sockets.
* Crypto: Check the current balances of a named CounterWallet.
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

Created sequences can be im- and exported as JSON files, which can be embedded into any context the user may desire with the included stand-alone player or simulated in a bare core
instance, which permits sequences to be leveraged in other javascript projects as a domain specific visual
scripting language by providing the embedded graph with appropriate values from its host, updating the graph
and acting on the emitted output values. Created sequences can be automatically exported to an
optimized file set, ready to deploy to any webserver.

Currently using Web Sockets or OSC requires running Vizor Create locally.

# Running Vizor Create locally

### Installing

Install and run [MongoDB](http://mongodb.org) and [Node.js](http://node.js.org), then install the required npm packages:

```
    $ npm install
    $ npm install -g gulp mocha
```

### Building

To build the LESS, plugins, etc [continuously]:

```
    $ gulp [watch]
```

Running the tests: ```$ npm test```

### To run Vizor Create,

1. Make sure MongoDB is running.
2. Run the server: ``` $ npm start```
3. Open in the browser: [http://localhost:8000/edit](http://localhost:8000/edit)

If you have access to an Oculus Rift DK1 or DK2 and want to play with the VR features, you currently
need one of Toji's special Chromium builds. You can find them here: http://blog.tojicode.com/2014/07/bringing-vr-to-chrome.html

# Contributing

We welcome your contributions! Please create a fork to work in and submit a pull request.

We're starting work to migrate the codebase to a more modern code style. New work should be done in JavaScript ES5 using AirBnb code style (except tabs instead of spaces).

