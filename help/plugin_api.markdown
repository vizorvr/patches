<link href="style.css" rel="stylesheet"></link>

#<span style="font-family: 'greyscale_basic_regular', sans-serif;">E N G I</span>

##Plugin development and API

###Introduction:
Each plugin is implemented as a script placed in the *plugins* folder and having the extension .plugin.js.

Individial plugins are registered with the system and placed in the editor context menu by adding them to
*plugins/plugins.json*, each line having the following syntax:

    "Contextmenu path": "filename_without_extension"
    
The context menu path is similar to a normal UNIX path (using forward slashes), with each path element
corresponding to a subgroup in the menu and the leaf node being the name of the plugin itself.
  
###Plugin conceptual operation:
Each plugins can be roughly categorized into one of three groups:

* **Generators**: Plugins that only have output slots. Represents sources of data, which can be anything from
user input to execution context values.

* **Modulators**: Plugins with both in- and outputs. Can be considered filters and represent operations on data
from one or more sources.

* **Emitters**: Plugins with only input slots. Usually provide final presentation of data wich can be rendering,
playback or recording.

A few plugins have neither in- or outputs and these usually serve cosmetic purposes. One example is the 
Annotation plugin, which provides a persistent on-canvas note or comment.

###Plugin implementation:

The beginning of each plugin implemenatation starts with the declaration of a constructor function and its
assignment to a property in the *plugins* registry contained in the *E2* namespace. To avoid leaving a dangling 
temporary variable around after load of the last registered plugin, this is typically simultaneously assigned
to the *E2.p* variable to aid in subsequent prototypical declaration of plugin methods.

Example:

<pre style="font-size: 10px; font-weight:bolder;">
    E2.p = E2.plugins["filename_without_extension"] = function(core, node)
    {
    	this.desc = 'Text string describing the plugin and its operation.';
    
    	this.input_slots = [ 
    		{ name: 'in', dt: core.datatypes.FLOAT, desc: 'Positive or negative input value', def: 0 }
    	];
    
    	this.output_slots = [
    		{ name: 'out', dt: core.datatypes.BOOL, desc: 'True if <b>in</b> > 0', def: true }
    	];
    	
    	this.state = {} // Optional. Declaration can be ommitted.
    };
</pre>

The name of the property of *E2.plugins* the constructor is assigned to must match the filename of the plugin
implementation sans extension, and also the identifier used to register it in *plugins/plugins.json*.

In- and output slot arrays can be empty, but must be present. Slots declared at plugin creation time are
termed *static*, as opposed to slots created arbitrily after plugin instantiation, which are called *dynamic*.

The state member object is automatically persisted and deserialized by the Core. If a plugin does not require
persistent state, the *plugin.state* member can be left undefined.

The plugin model is event driven. Event handlers are simply methods using reserved names that - if declared
by a given plugin - are automatically called by the Core at appropriate times. Plugins implementators can
choose to implement any subset of these that are relevant for the behaviour of a given plugin. In the 
following section, all reserved methods will be described:

###Plugin API:

#####E2.p.prototype.reset = function()

Called on plugin load, instantiation and when playback is stopped.
Is scheduled for deprecation in favour of `stop()`, and should not be used unless strictly necessary.

---

#####E2.p.prototype.destroy = function()

If declared, this method will be called by the core immediately before its parent Node is destroyed
along with all associated resources.

---

#####E2.p.prototype.play = function()
    
Called immediately before graph playback begins.

---

#####E2.p.prototype.pause = function()
    
Called immediately after graph playback is paused.

---

#####E2.p.prototype.stop = function()

Called immediately after graph playback is stopped.

---

#####E2.p.prototype.connection_changed = function(on, conn, slot)

Called when the state of a given in- or outbound connection to or from this plugin changes.

* **on** (boolean): True is a new connection was formed and false is an existing connection was deleted.
* **conn** (connection instance): The object representing the connection that was just made ot is about
to be destroyed. It has the following properties:
 * **src\_node** (node instance): The source node of the connection. If the connection is outbound, this
 will be equivalent to the **node** parameter given to our construction function when the plugin is
 first instantiated.
 * **dst\_node** (node instance): The destination node of the connection. If the connection is inbound, this
 will similarly be equivalent to the **node** parameter given to our construction function when the plugin is
 first instantiated.
 * **src\_slot** (slot instance): The originating slot (see `update_input()` below for more details).
 * **dst\_slot** (slot instance): The destination slot.
 * **ui** (connectionui instance): Only set when the plugin is on the currently active canvas and false
 otherwise.
* **slot** (slot declaration): The slot to which a connection was made to or from.

This method is typically implemented when a plugin need to respond to disconnection of inbound sources of
data.

---

#####E2.p.prototype.update\_input = function(slot, data)

Called whenever an input slot has new data to deliver. 

* **slot**: The decorated slot declaration that received the data
* **data**: The new data value. This is guranteed to be of the correct type and match that of the slot.

The **slot** parameter is an object containing the following members:

* **slot.desc** (string): Slot description.
* **slot.dt** (core.datatypes reference). In turn contains:
 * **slot.dt.id** (integer): Numeric datatype id.
 * **slot.dt.name** (string): Human-redable datatype name
* **slot.index** (integer): Static slot index. Equivalent to the index of the corresponding slot declaration as
specified in the contructor function of the plugin.
* **slot.is\_connected** (boolean): Indicates whether the slot is currently connected.
* **slot.name** (string): The slot name as show in the UI.
* **slot.type** (integer): The slot type. 0 = input, 1 = output.
* **slot.uid** (integer): *Optional* -- only present if this is a dynamic slot.

To check what static slot is currently receiving input **slot.index** is used. The data can either be
stored in plugin trainsient state by storing it in an arbitrary class property, be stored in the persisted
**plugin.state** object, change UI state in response on incoming data and so on.

If the plugin declares dynamic slots, whether **slot.uid** is defined can be used to differenciate 
between input to dynamic vs. static slots. Remember that **slot.uid** can legally be zero, so use 
`(slot.uid !== undefined)` to check for this.

---

#####E2.p.prototype.update\_state = function(delta\_t)

Called one every frame after all calls to `update_input()` has completed, if:

* One or more of the connected input slots have changed value.
* This plugin has no output slots
* This plugin has no input slots
* This plugin is a nested graph

The **delta_t** parameter is the delta time from the last frame was rendered in fractional seconds.

---

#####E2.p.prototype.update\_output = function(slot)

Called once for every connected output slot if `update_state()` was previously called this frame. 
Like `update_input()`, the **slot** parameter is a slot declaration and contains exactly the same members.

---

#####E2.p.prototype.create\_ui = function()

Called when the canvas on which the plugin resides is being switched to for editing. 

jQuery is guaranteed to be available globally, so **$** can be used, although the used of jQuery,
especially for event handling is discouraged in production code for performance reasons.

Plugin implementators can create any nested set of DOM objects here, set up their own event
handling and anything else they might like. When done, `create_ui()` is expected to return the
root DOM element created, which will be dynamically shown on the surface of the plugin instance
whenever visible in the editor.

---

#####E2.p.prototype.state\_changed = function(ui)

This method is called once after plugin creation or deserialization with **ui** set to *null*. This call
can be used to do fundamental plugin instance initialization. If the plugin declares a UI, this method 
will be called seperately with `ui` equal to the root DOM element returned by `create_ui()` earlier.

###Other reserved plugin member names:

* **id** (string): The plugin type name as declared in *plugins/plugins.json*.
* **updated** (boolean): Flag indicating whether any input slots have updated this frame and whether 
`update_state()` need to be called as a consequence.
* **e2\_is\_graph** (boolean): A special state-flag used to identity nested graphs.

###Common pitfalls:

* **Performing computation in `update_output()`**:
Since output slots can be connected to more than once receiver concurrently, `update_output()` will be 
called once for each outbound connection that's attached when the Core detects a successful run of
`update_state()`. Thus calculations should always be performed in `update_state()` which will at most 
be run once per frame, and cached later to be returned on request from `update_output()`.

###Advanced topics:

* **WebGL rendering**:
The current WebGL graphics context of the active rendering canvas can be obtained via the `core` parameter
supplied to the plugin constructor function as: **core.renderer.context**

* **Computing and caching output values in `update_input()`**:
As an exception to the above rule, it is possible is very simple cases to perform a calculation directly
in `update_input()` and cache it for later emission by `update_output()`, omitting implementation of
`update_state()` which will yield slightly better performance. This can only be done where the calculation 
depend on the value of a single input only, since the update order of input slots are not guranteed. In
cases where the result of a plugin depends on the value of more than one input, the input values must be 
cached and the calculation be performed in `update_state()`.

For example, we can imagine a plugin which adds 1 to an input float value implement its `update_input()`
and `update_output()` as follows:

    E2.p.prototype.update_input = function(slot, data)
    {
    	// We have only one input, no need to mask on slot.index -- it will always be 0
    	// 'data' is guaranteed to be a float.
    	this.output_value = data + 1;
    };
    
    // No need for update_state() here...
    
    E2.p.prototype.update_output = function(slot, data)
    {
    	return this.output_value;
    }

* **Blocking plugin data output based on logic in `update_state()`**:
Whenever `update_state()` is called, it's implied that the plugin `updated` property is **true**. It
is possible for a plugin implementation to abort data output based on logic in `update_state()`by setting
`updated` to **false**, in which case no calls to `update_output()` will occur.
