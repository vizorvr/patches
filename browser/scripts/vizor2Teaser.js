jQuery('.hero__scroll-down')
.on('click', function() {
    var loc = jQuery('.introduction').offset().top;
    $("html, body").animate({ scrollTop: loc + 'px' }, 500);
});
