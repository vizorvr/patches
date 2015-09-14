(function($) {
	$.fn.movable = function(options) {
	var $dragEl = $(this)
	
	if (options && options.handle) {
		$dragEl = options.handle;
	} else {
		$dragEl.prepend('<div class="drag-handle"></div>');
		$dragEl = $dragEl.find('.drag-handle');
		$(this).height($(this).height()+parseInt($('.drag-handle').css('height')));
	};
	
	var $dragged = $(this);
		$dragEl
			.on('mousedown touchstart', function(e) {
				var x = $dragged.offset().left - e.pageX;
				var	y = $dragged.offset().top - e.pageY;
				$(window)
					.on('mousemove.movable touchmove.movable', function(e) {
						$dragged.css({
									'bottom': 'auto', 
									'right': 'auto'
									})
								.offset({
									left: x + e.pageX,
									top: y + e.pageY
								});
						e.preventDefault();
					})
					.one('mouseup touchend touchcancel', function() {
						$(this).off('mousemove.movable touchmove.movable click.movable');
					});
				e.preventDefault();
			})
			.one('mouseup touchend touchcancel', function() {
				$(this).off('mousemove.movable touchmove.movable click.movable');
			});
		return this;
	};
})(jQuery);