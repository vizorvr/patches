function ExpandableTextfield(node, tf, def_width)
{
	var handler = function(node, tf, def_width) { return function(e)
	{
		var s = '' + tf.val();
		
		tf[0].style.width = ((Math.max(def_width, s.length) * 7) + 2) + 'px';
		node.geometry_updated();
	}}(node, tf, def_width);
	
	tf.change(handler);
	tf.keyup(handler);
}
