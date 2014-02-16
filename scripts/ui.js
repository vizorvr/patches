function ExpandableTextfield(tf, def_width)
{
	var handler = function(e)
	{
		var s = '' + tf.val();
		
		tf.css('width', '' + ((Math.max(def_width, s.length) * 7) + 2) + 'px');
	};
	
	tf.change(handler);
	tf.keyup(handler);
}
