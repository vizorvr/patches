function AssertException(message) 
{ 
	this.message = message;
	
	this.toString = function()
	{
		return 'AssertException: ' + this.message;
	};
}

function assert(exp, message) 
{
	if (!exp)
		throw new AssertException(message);
}
