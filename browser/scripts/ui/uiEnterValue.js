// moved without changes from NodeUI.enterValueControl
var uiEnterValueControl = function(node, parentNode, onChange, options) {

	var $node = jQuery(node)
	var $parent = jQuery(parentNode)
	if ($node.hasClass('uiTextInput')) return true;
	var o = {
		type : 'text',
		placeholder : ''
	}

	var $input = $('<input class="node-value-input" type="'+ o.type +'" placeholder="'+ o.placeholder +'" />')

	var nodeOffset = $node.offset();
	var parentOffset = $parent.offset();

	$node.addClass('uiTextEntry');
	var controlWidth = $node.innerWidth()
	if (controlWidth < 30) controlWidth = 30;

	var parentStylePosition = $parent.css('position');
	if (parentStylePosition === 'static') parentStylePosition = ''
	if (!parentStylePosition) {
		$parent.css({
			'position' : 'relative'
		})
	}

	function tryChange(value) {
		if (value === "") value = oldValue
		if (value !== oldValue) {
			onChange(value, oldValue)
			oldValue = value
			return true;
		}
		return false
	}
	var oldValue = $node.text();
	var cancelling = false
	var done = false

	var forceBlur = function(e) {
		var t = e.target
		if (t !== $input[0]) $input.trigger('blur')
		return true;
	}

	document.addEventListener('mousedown', forceBlur, true)
	$input
		.addClass('uiTextEntry')
		.appendTo($parent)
		.css({
			position: 'absolute',
			width:  '' + controlWidth + 'px',
			left: '' + (nodeOffset.left - parentOffset.left ) + 'px',
			top: '' + (nodeOffset.top - parentOffset.top ) + 'px',
			'z-index' : 3001,
			margin: 0
		})
		.val(oldValue)
		.keydown(function(e){
			var code = e.keyCode || e.which
			if (code === 13) {
				var value = $(e.target).val().replace(/^\s+|\s+$/g,'') // remove extra spaces
				done = true
				tryChange(value)
				jQuery(e.target).trigger('blur');
			}
			return true;
		})
		.keyup(function(e) {
			var code = e.keyCode || e.which
			if(code === 27) {
				cancelling = true
				jQuery(e.target).trigger('blur');
			}
			return true;
		})
		.select()
		.bind('blur', function(e) {
			if (!(cancelling || done)) {
				var value = $(e.target).val().replace(/^\s+|\s+$/g,'') // remove extra spaces
				tryChange(value)
			}
			$(this).remove();	// this = input
			$node.removeClass('uiTextEntry');
			$parent.css({
				position: parentStylePosition
			});
			document.removeEventListener('mousedown', forceBlur, true)
		})
		.focus()
}