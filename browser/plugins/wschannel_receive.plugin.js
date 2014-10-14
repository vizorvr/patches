E2.p = E2.plugins["wschannel_receive"] = function(core, node)
{
	this.desc = 'Emits all messages received via a Web Socket PubSub Channel sent by other peers in that channel.';

	this.input_slots = [
		{ name: 'channelName', dt: core.datatypes.TEXT, desc: 'Channel name' },
	];

	this.output_slots = [
		{ name: 'message', dt: core.datatypes.OBJECT, desc: 'Messages received' }
	];

	core.add_aux_script('wschannel/wschannel.js');
}

E2.p.prototype.update_input = function(slot, data)
{
	var that = this;

	wsChannel.off(this._channelName);

	this._channelName = data;

	wsChannel.join(this._channelName);

	wsChannel.on(this._channelName, function(m)
	{
		that.updated = true;
		that._message = m;
	});
}

E2.p.prototype.reset = function()
{
	this._message = null;
}

E2.p.prototype.update_output = function(slot)
{
	return this._message;
}
