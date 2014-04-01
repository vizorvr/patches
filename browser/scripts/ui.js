function ExpandableTextfield(node, tf, def_width)
{
	var self = this;
	
	this.node = node;
	this.tf = tf;
	this.def_width = def_width;
	
	this.update = function()
	{
		var s = '' + self.tf.val();
		
		self.tf[0].style.width = ((Math.max(self.def_width, s.length) * 7) + 2) + 'px';
		self.node.geometry_updated();
	};
	
	var handler = function(self) { return function(e)
	{
		self.update();
	}}(this);
	
	tf.change(handler);
	tf.keyup(handler);
}
