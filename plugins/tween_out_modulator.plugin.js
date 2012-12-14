E2.p = E2.plugins["tween_out_modulator"] = function(core, node)
{
	this.desc = 'Perform tween out over time.';
	this.input_slots = [ { name: 'time', dt: core.datatypes.FLOAT, desc: 'Time ranging from zero to one.', def: 0, lo: 0, hi: 1 } ];
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT, desc: 'Emits a tween out over <b>time</b>.', def: 0 } ];

	this.state = { type: 0 };
};

E2.p.prototype.create_ui = function()
{
	var inp = $('<select />', { selectedIndex: 0 });
	var create = function(val, txt) { $('<option />', { value: val, text: txt }).appendTo(inp) };

	create(0, 'Circular');
	create(1, 'Cubic');
	create(2, 'Exponential');
	create(3, 'Quadratic');
	create(4, 'Quartic');
	create(5, 'Quintic');
	create(6, 'Sinusoidal');

	 
	inp.change(function(self) { return function() 
	{
		self.state.type = parseInt(inp.val());
	}}(this));
	
	return inp;
};

E2.p.prototype.reset = function()
{
	this.result = 0.0;
	this.time = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.time = data < 0.0 ? 0.0 : data > 1.0 ? 1.0 : data;
};	

E2.p.prototype.update_state = function(delta_t)
{
	var r = 0, d = this.time;
	
	switch(this.state.type)
	{
		case 0:
			r = Math.sqrt(1 - --d * d);
			break;
	
		case 1:
			r = --d * d * d + 1;
			break;

		case 2:
			r = d === 1 ? 1 : 1 - Math.pow(2, -10 * d);
			break;

		case 3:
			r = d * (2.0 - d);
			break;

		case 4:
			r = 1 - --d * d * d * d;
			break;

		case 5:
			r = --d * d * d * d * d + 1;
			break;

		case 6:
			r = Math.sin(d * Math.PI / 2);
			break;

		default: break;
	}
	
	this.result = r;
};

E2.p.prototype.update_output = function(slot)
{
	return this.result;
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.type);
};

