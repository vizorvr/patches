(function() {

function MidPane() {
}

MidPane.prototype.newTab = function newTab(name, closeCb) {
	// @returns tab body after creating tab header and content divs
	var $pane = $('#mid-pane')
	$pane.removeClass('pane-hidden')

	var id = 'tab-'+Date.now()
	var $li = $('<li>'+
		'<a href="#'+id+'" role="tab" data-toggle="tab">'+name+
			'<i class="fa fa-close fa-sm pull-right tab-close-button"></i>'+
		'</a></li>');

	function updateActive() {
		$('li', $pane).removeClass('active')
		$('li:last', $pane).addClass('active')
		$('.tab-pane', $pane).removeClass('active')
		$('.tab-pane:last', $pane).addClass('active')
	}

	$('ul.nav-tabs', $pane).append($li)

	var $content = $('<div role="tabpanel" class="tab-pane" id="'+id+'">'+
		'<div class="tab-body"></div>'+
	'</div>');

	$('.tab-content', $pane).append($content)
	var $tabBody = $('.tab-body', $content)

	$li.find('.tab-close-button').click(function() {
		$li.remove()
		$tabBody.remove()
		$content.remove()
		closeCb()
		updateActive()
	})

	updateActive()

	return {
		show: function() {
			$pane.removeClass('pane-hidden')
			$li.find('a:first').click()
			E2.app.onWindowResize()
		},
		body: $tabBody
	}
}

E2.MidPane = MidPane;

})()

