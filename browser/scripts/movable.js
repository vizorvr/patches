(function($) {
	$.fn.movable = function(options) {
	var $dragEl=$(this)
	
	if (options.handle) {
		$dragEl = options.handle;
	};
	
	$dragEl.append('<div id="dragHelper" style="position: absolute; width: 100%; height: 100%; z-index: 98; display: none;"></div>');
	
	var $dragged = $(this);
		
		$dragEl
			.on('mousedown touchstart', function(e) {
				var x = $dragged.offset().left - e.pageX;
				var	y = $dragged.offset().top - e.pageY;
				$(window)
					.on('mousemove.movable touchmove.movable', function(e) {
						$dragEl.find('#dragHelper').show();
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
						$dragEl.find('#dragHelper').hide();
					});
				e.preventDefault();
			})
			.one('mouseup touchend touchcancel', function() {
				$(this).off('mousemove.movable touchmove.movable click.movable');
				$dragEl.find('#dragHelper').hide();
			});
		return this;
	};
})(jQuery);