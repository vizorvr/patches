(function() {

function MidPane() {
	var that = this
	this._tabs = []

	this._$pane = $('#shader-block')
	this._$tabs = $('ul.nav-tabs', this._$pane)
	this._$tabContent = $('.tab-content', this._$pane)

	jQuery('div.block-header button').off('.midpane')
	jQuery('div.block-header button.close-button', this._$pane).on('click.midpane', this.close.bind(this))
	jQuery('div.block-header button.toggle-button', this._$pane).on('click.midpane', function(){
		that._$pane.toggleClass('collapsed')
		jQuery('div.tab-content', that._$pane).toggle()
		return false
	})
	// @todo #761
}

MidPane.prototype._tabClosed = function(tab) {
	this._tabs = this._tabs.filter(function(t) {
		return t.$li !== tab.$li
	})

	if (!this._tabs.length)
		this.close()

	tab.onClose()
}

MidPane.prototype.show = function() {
	if (this._$pane.hasClass('uiopen')) return false
	this._$pane.addClass('uiopen').show()
	E2.app.onWindowResize()
	return true
}

MidPane.prototype.closeAll = function() {
	this._$tabs.empty()
	this._$tabContent.empty()
	this._tabs.forEach(this._tabClosed.bind(this))
}

MidPane.prototype.close = function() {
	this._$pane.removeClass('uiopen').hide()
	E2.app.onWindowResize()
	return true
}

// @returns tab body after creating tab header and content divs
MidPane.prototype.newTab = function newTab(name, closeCb) {
	var that = this

	this.show()

	var id = 'tab-'+Date.now()
	var $li = $('<li>'+
		'<a href="#'+id+'" role="tab" data-toggle="tab">'+name+
			'<i class="fa fa-close fa-sm pull-right tab-close-button"></i>'+
		'</a></li>');

	function updateActive() {
		$('li', that._$pane).removeClass('active')
		$('li:last', that._$pane).addClass('active')
		$('.tab-pane', that._$pane).removeClass('active')
		$('.tab-pane:last', that._$pane).addClass('active')
	}

	function closeTab() {
		if (!$li)
			return
		$li.remove()
		$li = null
		$tabBody.remove()
		$content.remove()
		updateActive()
		that._tabClosed(tab)
	}

	this._$tabs.append($li)
	var tab = {
		$li: $li,
		onClose: closeCb
	}
	this._tabs.push(tab)

	var $content = $('<div role="tabpanel" class="tab-pane" id="'+id+'">'+
		'<div class="tab-body"></div>'+
	'</div>');

	this._$tabContent.append($content)
	var $tabBody = $('.tab-body', $content)

	$li.find('.tab-close-button').click(closeTab)

	updateActive()

	return {
		close: closeTab,
		show: function() {
			that.show()
			$li.find('a:first').click()
		},
		body: $tabBody
	}
}

E2.MidPane = MidPane;

})();

