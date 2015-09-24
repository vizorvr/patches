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
		that.dom.filterPullDown.click(userpage.filterPullDownClicked);
		that.dom.uPullDown.click(userpage.uPullDownClicked);
	}
};

$.ready(userpageUI.init);