E2.p = E2.plugins["log_display"] = function(core, node)
{
	this.desc = 'Pipes the supplied text to the browser console log.';
	
	this.input_slots = [ 
		{ name: 'text', dt: core.datatypes.TEXT, desc: 'Input text to be logged in the browsers console.' }
	];
	
	this.output_slots = [];
};

E2.p.prototype.update_input = function(slot, data)
{
	console.log(data);
};
