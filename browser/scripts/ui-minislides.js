/**
 * @author gmarinov
 * @param $container
 */
var Minislides = function($container) {
	var that = this;
	this.container = $container;
	this.slideContainer = jQuery('div.slides', this.container);
	this.slides = jQuery('section', this.container);
	this.slideSwitcher = jQuery('<div></div>');
	this.selected = 0;
	this.slideWidth = this.slides.first().outerWidth();
	this.slideHeight = this.slides.first().outerHeight();

	/*
	// horizontal
	this._slideFunction = function(ix){
		var leftPx = -ix * that.slideWidth;
		that.slideContainer.css('left', '' + leftPx + 'px');
	};
	*/
	this._slideFunction = function(ix){
		var selected = this.slides.eq(ix);
		selected.fadeIn(350);
		this.slides.not(selected).fadeOut(650);
	}

	return this.init();
};

Minislides.prototype.init = function() {
	var that = this;
	this.slideSwitcher
		.addClass('slideSwitcher')
		.appendTo(this.container);

	this.slides.each(function(ix){
		jQuery(this).addClass('slide'+(ix+1));
		var $step = jQuery("<button class='slide-step' data-index='"+ix+"'></button>");
		$step.appendTo(that.slideSwitcher);
		$step.on('click', function(e){
			e.preventDefault();
			e.stopPropagation();
			that.showSlide(ix);
			return false;
		});
	});

	jQuery('a.slide-next, img', this.slides)
		.off('.minislides')
		.on('click.minislides', function(e){
			e.preventDefault();
			e.stopPropagation();
			that.nextSlide();
			return false;
		})

	this.showSlide(0);

	return this;
};

Minislides.prototype.nextSlide = function() {
	this.showSlide(this.selected + 1);
};

Minislides.prototype._setSelectedStep = function() {
	jQuery('.slide-step',this.slideSwitcher)
		.removeClass('selected')
		.eq(this.selected)
			.addClass('selected');
};

Minislides.prototype.showSlide = function(ix) {
	ix = ix % this.slides.length;
	this.selected = ix;
	this._slideFunction(ix);
	this._setSelectedStep();
	var ev = new CustomEvent('slideChange', {detail: {index: ix, slide: this.slides[ix]}});
	this.container[0].dispatchEvent(ev);
	return this;
};