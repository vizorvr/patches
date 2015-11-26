var assetUIEvent = {	// CustomEvent names (dispatched on document)
	graphNew 		: 'graph.new',
	graphOpen 		: 'graph.open',
	graphDuplicate 	: 'graph.duplicate',
	graphMove 		: 'graph.move',
	graphDelete 	: 'graph.delete',
	graphPublish 	: 'graph.publish',
	graphDownload 	: 'graph.download',
	graphShare 		: 'graph.share'
	// projectNew		: 'project.new' etc.
}
var userpages = new function() {
	var that = this;

	this.init = function() {
		document.addEventListener(assetUIEvent.graphOpen, this.handleGraphOpen);
		jQuery('#contentcontainer .asset.card').each(function(){
			var $card = jQuery(this);
			VizorUI.setupAssetCard($card);
		});
	};

	// currently unused as the buttons are wired directly (for search-engine indexing)
	this.handleGraphOpen = function(e) {
		if (e && e.detail && e.detail.url) {
			e.preventDefault();
			e.stopPropagation();
			window.location.href = e.detail.url;
		}
		return false;
	};
};


jQuery(document).ready(userpages.init.bind(userpages));