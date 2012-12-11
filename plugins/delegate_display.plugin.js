E2.p = E2.plugins["delegate_display"] = function(core, node)
{
	this.desc = 'Display the value a supplied delegate evaluates to, given a parameter value \'<b>x</b>\'.';
	
	this.input_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'The parameter to be supplied to <b>delegate</b> during evaluation.' },
		{ name: 'delegate', dt: core.datatypes.DELEGATE, desc: 'The delegate to be evaluated.' }
	];
	
	this.output_slots = [];
};

E2.p.prototype.reset = function()
{
	this.update_value(null);
}

E2.p.prototype.create_ui = function()
{
	this.label = make('div');
	this.label.css('text-align', 'right'); 
	this.update_value(null);
	
	return this.label;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on)
		this.update_value(null);
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.x = data;
	else
		this.delegate = data;
};

E2.p.prototype.update_state = function(delta_t)
{
	if(!this.delegate)
		return;
	
	this.update_value(this.delegate.delegate(this.x));
};

E2.p.prototype.update_value = function(value)
{
	if(this.label)
		this.label[0].innerHTML = value === null ? '-' : value.toFixed(2);
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.x = 0.0;
		this.delegate = null;
	}
};
