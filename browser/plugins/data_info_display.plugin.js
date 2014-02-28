E2.p = E2.plugins["data_info_display"] = function(core, node)
{
	this.desc = 'Displays metrics about the input value and its type.';
	
	this.input_slots = [ 
		{ name: 'any', dt: core.datatypes.ANY, desc: 'Input value to be analyzed.' }
	];
	
	this.output_slots = [];
};

E2.p.prototype.reset = function()
{
	this.update_value(null);
}

E2.p.prototype.create_ui = function()
{
	this.label = make('pre');
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
	this.update_value(data);
};

E2.p.prototype.update_value = function(value)
{
	if(this.label)
	{
		var typeOf = function(obj)
		{
			type = typeof(obj);
			
			return type === 'object' && !obj ? 'null' : type;
		};

		var introspect = function(name, obj, indent, level)
		{
			indent = indent || '  ';
			
			if(typeOf(level) !== 'number')
				level = 1;
			
			var objType = typeOf(obj);
			
			if(objType === 'function')
				return '';
			
			var result = indent + name + '(' + objType + ') :';
			
			if(objType === "object")
			{
				if(level > 0)
				{
					indent += '  ';
					
					for(prop in obj)
					{
						var prop = introspect(prop, obj[prop], indent, level - 1);
						
						result += "\n" + prop;
					}
					
					return result;
				}
				else
					return result + ' ...';
			} 
			else if(objType === 'null')
				return result + ' null';
	
			return result + ' ' + obj;
		};
		
		this.label[0].innerHTML = introspect('', value);
	}
};
