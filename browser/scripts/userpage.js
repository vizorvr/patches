var userpageUI = new function() {
	var that = this;
	this.dom={};
	this.dom.filterPullDown = $('#filter-pulldown');
	this.dom.filterDropDown = $('#filter-dropdown');
	this.dom.uPullDown = $('#user-pulldown');
	this.dom.uDropDown = $('#user-dropdown');

	this.filterPullDownClicked = function() {
		that.dom.filterDropDown.toggle();
		that.dom.filterPullDown.toggleClass('active');
	};

	this.uPullDownClicked = function() {
		that.dom.uDropDown.toggle();
		that.dom.uPullDown.toggleClass('active');
	};

	this.init = function() {
		that.dom.filterPullDown.click(that.filterPullDownClicked);
		that.dom.uPullDown.click(that.uPullDownClicked);
		
		//temporary code for static version;
		$('button.ca-open').click(function() {
			$('ul#user-nav li').hide().first().show().addClass('active');;
			$('#nav-breadcrumb').show();
			$('#new-project-card').hide();
			$('#new-graph-card').show();
		});
		$('ul#user-nav li:first-child a').click(function() {
			$('ul#user-nav li').show().first().removeClass('active');;
			$('#nav-breadcrumb').hide();
			$('#new-project-card').show();
			$('#new-graph-card').hide();
		});
		$('.form-input.form-select label').click(function() {
			if (!$('.form-input.form-select').hasClass('active')) {
				var listh = $('#graphTypesDropdown li').outerHeight(true) * ($('#graphTypesDropdown>li').length + 1);
				var newh = $('#newProjectModal modal-body').outerHeight(true) + listh;
				$('.form-input.form-select').addClass('active').height(listh);	
			} else {
				$('.form-input.form-select').removeClass('active').height('');	
			}
			return false;
		});
		$('#graphTypesDropdown li').click(function() {
			$('.form-input.form-select').removeClass('active').height('');	
			$('#userGraphType_id').val($(this).attr('id'));
			$('.form-input.form-select label').html($(this).html());
		});
		$('.user-btn').click(function() {
			$('.bootbox.modal.in').hide();
			$('.modal-backdrop.in').hide();
		});
		$('#new-project-card').click(function() {
			$('#newProjectModal').show();
			$('.modal-backdrop.in').show();
		});
		$('#new-graph-card').click(function() {
			$('#newGraphModal').show();
			$('.modal-backdrop.in').show();
		});
	};
};

$.ready(userpageUI.init());