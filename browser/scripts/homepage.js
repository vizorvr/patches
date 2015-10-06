var $canvas, $window, $stage;

var hp = new function() {
	var _self = this;
	
	this.bind_ui = function() {
		$('.team-member').click(function() {
			window.open($(this).find('.profile-link').attr('href'));
		})
		$('.team-button').click(function(e) {
			var teamY = $window.height();
			$("html, body").animate({scrollTop: teamY}, 500);
			e.preventDefault();
			return false;
		})
	}
	
	this.onResize = function() {
		setTimeout(function() {
			var width = $window.width();
			var height = $window.height();

			$stage.css('width', width + 'px')
			$stage.css('height', height  + 'px')
		}, 20)
	}
	
	this.init = function() {
		$window = $(window);
		$stage = $('.stage--front');

		$(window).on('resize', _self.onResize);

		_self.onResize();
		_self.bind_ui();
	};
};

jQuery(hp.init.bind(hp));