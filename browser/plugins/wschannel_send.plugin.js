E2.p = E2.plugins["wschannel_send"] = function(core, node)
{
	this.desc = 'Sends messages to Web Socket PubSub Channel for other peers in the channel to receive.';

	this.input_slots = [
		{ name: 'channelName', dt: core.datatypes.TEXT, desc: 'Channel name' },
		{ name: 'message', dt: core.datatypes.OBJECT, desc: 'Message to send' },
	];

	this.output_slots = [];

	core.add_aux_script('wschannel/wschannel.js');
}

E2.p.prototype.update_input = function(slot, data)
{
	switch(slot.index) {
		case 0:
			this._channelName = data;
			wsChannel.join(this._channelName);
			break;
		case 1:
			if (this._channelName)
			{
				wsChannel.send(this._channelName, data);
			}
			break;
	}
}

E2.p.prototype.reset = function()
{
	this._channelName = null;
}
