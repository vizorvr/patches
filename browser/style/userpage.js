$(function() {

function filterPullDownClicked() {
	filterDropDown.toggle();
	filterPullDown.toggleClass('active');
};

function uPullDownClicked() {
	uDropDown.toggle();
	uPullDown.toggleClass('active');
};

var filterPullDown = $('#filter-pulldown');
var filterDropDown = $('#filter-dropdown');
var uPullDown = $('#user-pulldown');
var uDropDown = $('#user-dropdown');
	
filterPullDown.click(filterPullDownClicked);
uPullDown.click(uPullDownClicked);

});

