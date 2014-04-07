E2.p = E2.plugins["osc_receiver"] = function(core, node)
{
	this.desc = 'Emits all messages received via OSC.';

	this.input_slots = [];
	this.output_slots = [
		{ name: 'address', dt: core.datatypes.TEXT, desc: 'Recipient address' },
		{ name: 'message', dt: core.datatypes.OBJECT, desc: 'Actual OSC message' }
	];
	
	this.core = core;
};

E2.p.prototype.play = function()
{
	var self = this;
	
	OscProxy.listen('*', function(address, message)
	{
		self.updated = true;
		self._address = address;
		self._message = message;
	});
};

E2.p.prototype.reset = function()
{
	this._address = this._message = null;
};

E2.p.prototype.update_output = function(slot)
{
	if(slot.index === 0)
		return this._address;

	return this._message;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.core.add_aux_script('osc/osc-proxy.js');
};
