E2.p = E2.plugins["crypto_cw_get_balances"] = function(core, node)
{
	this.desc = 'Obtain information about the current balances of a CounterWallet address.';
	
	this.input_slots = [
		{ name: 'address', dt: core.datatypes.TEXT, desc: 'Address of the wallet to query.', def: '' }
	];
	
	this.output_slots = [
		{ name: 'balances', dt: core.datatypes.OBJECT, desc: 'The CounterWallet response.' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.address = data;
};

E2.p.prototype.update_state = function()
{
	if(this.address === '')
	{
		this.balances = {};
		return;
	}

	var req = '{"jsonrpc":"2.0","id":0,"method":"proxy_to_counterpartyd","params":{"method":"get_balances", "params":{"filters":{"field":"address","op":"==","value":"' + this.address + '"}}}}';
	
	$.ajax({
		url: 'https://counterwallet.co/_api',
		type: 'POST',
		data: req,
		cache: false,
		success: function(self) { return function(response)
		{
			self.balances = response;
			self.updated = true;
		}}(this)	
	});
};

E2.p.prototype.update_output = function(slot)
{
	return this.balances;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.balances = {};
		this.address = '';
	}
};
