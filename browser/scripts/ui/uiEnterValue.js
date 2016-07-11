// former NodeUI.enterValueControl
var uiEnterValueControl = function(node, parentNode, onChange, options) {

	var $node = jQuery(node)
	var $parent = jQuery(parentNode)
	if ($node.hasClass('uiTextInput')) return true;
	var o = _.extend({
		type : 'text',
		placeholder : '',
		onTransientChange: null		// supply your transient change handler here
	}, options)

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

	var oldValue = $node.text()
	var prevValue = oldValue

	function tryChange(value) {
		if (value === "") value = oldValue
		if (value !== oldValue) {
			onChange(value, oldValue)
			oldValue = value
			return true
		}
		return false
	}
	function transientChange(value) {
		if (value !== prevValue) {
			o.onTransientChange(value, prevValue)
			prevValue = value
			return true
		}
		return false
	}


	var cancelling = false
	var done = false

	var forceBlur = function(e) {
		var t = e.target
		if (t !== $input[0]) $input.trigger('blur')
		return true;
	}

	var commit = function(e) {
		var value = $(e.target).val().replace(/^\s+|\s+$/g,'') // remove extra spaces
		done = true
		tryChange(value)
		jQuery(e.target).trigger('blur');
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
				commit(e)
			}
			else if (code === 9) {
				// tab!
				e.preventDefault()
				e.stopPropagation()
				commit(e)
				$node[0].dispatchEvent(new CustomEvent('tabToNext'))
			}
			else if (o.onTransientChange) {
				var value = $(e.target).val().replace(/^\s+|\s+$/g,'') // remove extra spaces
				transientChange(value)
			}
			return true;
		})
		.keyup(function(e) {
			var code = e.keyCode || e.which
			if(code === 27) {
				cancelling = true
				if (o.onTransientChange) {
					$input.val(oldValue)
					transientChange(oldValue)
				}
				jQuery(e.target).trigger('blur');
			}
			else if (o.onTransientChange) {
				var value = $(e.target).val().replace(/^\s+|\s+$/g,'') // remove extra spaces
				transientChange(value)
			}
			return true;
		})
		.select()
		.bind('blur', function(e) {
			if (!(cancelling || done)) {
				var value = $(e.target).val().replace(/^\s+|\s+$/g,'') // remove extra spaces
				tryChange(value)
			}
			$(this).remove()	// this = input
			$node.removeClass('uiTextEntry')
			$parent.css({
				position: parentStylePosition
			})
			document.removeEventListener('mousedown', forceBlur, true)
		})
		.focus()
}