E2.p = E2.plugins["module_player"] = function(core, node)
{
//Adding external scripts from module_player -folder and making them thus available
//for player.js to call & access - thus enabling XM, S3M playback.
	core.add_aux_script('module_player/utils.js');
	core.add_aux_script('module_player/ft2.js');
	core.add_aux_script('module_player/st3.js');
	core.add_aux_script('module_player/pt.js');
	core.add_aux_script('module_player/player.js', function(self) { return function()
	{
		self.player = new Modplayer();
	}}(this));

	this.desc = 'Play either a Protracker -compatible .MOD file, or a Scream Tracker 3 -compatible .S3M file, or a Fast Tracker 2 -compatible XM file by using library by Firehawk/TDA (firehawk@haxor.fi).';
	
	this.input_slots = [ 
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'The url of the module to play.', def: null },
		{ name: 'play', dt: core.datatypes.BOOL, desc: 'Send True to start playback and False to stop.', def: false },
		{ name: 'pause', dt: core.datatypes.BOOL, desc: 'Send True to pause playback and False to resume playback.', def: false},
	];

	this.output_slots = [
		{ name: 'title', dt: core.datatypes.TEXT, desc: 'The title of the module', def:null},
		{ name: 'speed', dt: core.datatypes.FLOAT, desc: 'Current BPM', def: null},
		{ name: 'patternnumber', dt: core.datatypes.FLOAT, desc: 'Current playing pattern number', def: null }		
	]
	this.audio = null;
	this.playing = false;
	this.should_play = false;
};

E2.p.prototype.play = function() {
//Patches Play-button has been pressed	
//Called immediately before graph playback begins
console.log("Patches Play-button has been pressed - Graph playback resumed, resuming module playback.")

if (this.playing==true) {this.player.play();
console.log("i am playing")} else {console.log("i am not playing");return}
//this.player.play();

//if (this.playing == false){this.play();} else return
//this.play();

//The below is commented away just to make sure that switching to play in Patches WILL start playback of song
//	if(this.audio && !this.playing && this.should_play)
//	{
//		this.playing = this.should_play = true;
//		this.play();
//	}
};

E2.p.prototype.pause = function() {
//Patches Pause-button has been pressed
//Called immediately after graph playback is paused
console.log("Patches Pause-button has been pressed - Graph playback paused, pausing module playback")

if (this.playing == false) {this.play();} else {this.player.pause();}
//if(this.audio && this.playing && this.should_play){this.playing = this.should_play = true; this.pause();}

//this.pause();
// The below is commented away just to make sure that switching to pause WILL pause the song.
//	if(this.audio && this.playing && this.should_play)
//	{
//		this.playing = this.should_play = true;
//		this.pause();
//	}
//	if(this.audio && this.player && this.playing)
//	{
////		this.playing = false;
////		this.should_play = true;
//		this.pause();
//	}
};

E2.p.prototype.stop = function() {
//Patches Stop-button has been pressed
//Called immediately after graph playback is stopped.
//Unlike reset, it will not be called as part of plugin initialisation or deserialisation.

console.log("Patches Stop-button has been pressed - Graph playback stopped, pausing module playback.")	
this.player.pause();
	
// commented away as they added complexity
//	if(this.player && this.audio && this.playing)
//	{
//		if(this.playing)
//		{
//			console.log("i have been ordered to stop")
//			this.player.stop();
//		}
//	}

	
};

E2.p.prototype.update_input = function(slot, data) {
console.log("update_input has been called");
//Jak: in update_input(slot, data), don't use the data unless there is something.
//
//Called whenever an inbound connection has new data to deliver. The Core guarantees that
//connected input slots are processed in the same order that they are declared by the plugin.
//No similar guarantee is made for processing of output slots.
//
//Slot: The slot that receives the data
//
//Data: The new data value. This is guaranteed to be of the correct type and match that of
//the slot, although not all datatypes are guaranteed to have a specified value. For all 
//datatypes that are legally allowed to have no value such as Textures, an undefined value
//will always be null.
//
//The slot parameter is an object containing the following numbers:
//- slot.dynamic (boolean): If set to true, indicates that this slot is a dynamic slot.
//- slot.dec (string): Slot description.
//- slot.dt core.datatypes reference
//- slot.index (integer): Static slot index. Equivlent to the index of the corresponding slot
//  declaration as specified in the constructor function of the plugin.
//- slot.is_connected (boolean): Indicates whether the slot is currently connected.
//- slot.name (string): The sot name as shown in the UI.
//- slot.type (integer): The slot type. Either E2.slot_type.input or .output as appropriate.
//- slot.array (boolean): True if data coming from this input is an array (of slot.dt type data),
//  false otherwise
//- slot.uid (integer): Optional - only present if this is a dynamic slot.

	if(slot.index === 0)
	{
		this.player.onReady=function() 
		{return;}
if (data === null){return;} else
		{this.player.load(data)
		this.playing = true;}
	}
	else if(slot.index === 1) // Play: Receives True / False to start or stop playback.
	{
		console.log(data)
		this.should_play = data;
		if (this.should_play == false){this.player.stop();}
			 else {this.player.play(); return;}
	//	if false then this.stop() else this.play()
	//	this.stop();
		//this.should_play = data;
}
	else (slot.index === 2) // Pause: Receives True / False to start or stop pause
	{	console.log("I have been asked to pause the module player")
		this.should_pause = data;
		if (this.should_pause == false){this.player.pause();
			console.log("I have paused the module player")}
		else {this.player.pause();
			console.log("I have resumed the module player")}
}
};

E2.p.prototype.update_output = function(slot) {
console.log("update_output has been called");
//Jak: update_output() is called for
//a) each output connection
//b) in every frame
//Jak: in update_output(), this is called to get *the current value* whenever an output is
//     connected, this is a must

//Called once for every connected output slot 
//if update_state() was previously called this frame. Like update_input(), the slot parameter
//is the instance of the slot of this plugin being polled. See also: Plugin.prototype.query_output()


//Common pitfalls:
//- Performing computation in update_output(): Since output slots can be connected to 
//  more than one receiver concurrently, update_output() will be called once for each 
//  outbound connection that's attached when the Core detects a successful run of
//  update_state(). Thus calculations should always be performed in update_state() which will
//  at most be run once per frame, and cached to be returned on request from update_output()

	var player = this;
// console.log("playback pattern:", this.player.currentpattern()) // NOTE: this has been verified as working - but not required all the time
	if(slot.index === 0) // Title -slot output
	{
		return this.player.title;
//		console.log("Slot number index", slot.index, "Current Playing Pattern: ", this.player.currentpattern(), "Module title", this.player.title, "BPM: ", this.player.bpm
		console.log(this.player.title);
			
	}
	else if(slot.index === 1) // Speed -slot output (BPM)
	{
		return this.player.bpm
		console.log(this.player.bpm)
	}
	else (slot.index === 2) // Pattern number -slot output
	{
		var currpatt = this.player.currentpattern();
//		var currpatt = this.player.currentpattern(); // commented away to test if can directly return this.player.currentpattern();
		return currpatt;
//		return this.player.currentpattern();
		console.log(currpatt);
	}
};

E2.p.prototype.state_changed = function(slot, data) {
console.log("state_changed has been called");
//Jak: state_changed() is called _once_ when the plugin is created.
//
//This method is called once after plugin creation or deserialization, with ui set to null
//At this point the plugin should bind any event handlers that should only be added once
//If the plugin declares a UI, this method will be called separately with ui equal to the root
//DOM element returned by create_ui() earlier.
//When this method is called the following is true:
//- The state member will be deserialised and available.
//- The parent node will be fully deserialised with all data structures patched up and 
//  ready for use.

//        if (this.state.url != 0)
//              { console.log("something is not zero");}
//	else if (this.state.url == 0)
//{		console.log("something is zero")}

};


E2.p.prototype.update_state = function() {
console.log("update_state has been called");
//Jak: update_state() is called once per frame after your update_inputs() have been called,
// before update_output()
//Jak: In update_state() don't load if you don't have a this.state.url that's nonzero.
//
//Plugin.prototype.update_state = function(updateContext)
//Called once every frame after all calls to update_input() has completed, if:
//- One or more of the connected input slots have changed value.
//- This plugin has no output slots
//- This plugin has no input slots
//- This plugin is a nested graph _and_ doesn't have its .always_update property set to false.
//- updateContext specifies the context which any temporal calculations should be
//  executed in. It contains attributes updateContext.abs_t and updateContext.delta_t 
//  respectively for absolute time and delate time since the last frame.

	var player = this;
	
	if(!this.player || !this.player.ready)
		return;
	
	if(this.playing !== this.should_play)
	{
		if(this.should_play)
			this.play();
		else
			this.pause();
		
		this.playing = this.should_play;
	}
	
	if(!this.playing)
		return;

	this.updated = true;
};


//Still confused? Check out
// https://github.com/vizorvr/vizor/wiki/Plugin-Development-and-API