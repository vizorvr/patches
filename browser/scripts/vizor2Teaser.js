jQuery('.hero__scroll-down')
    .on('click', function(event) {
        event.preventDefault();
        var loc = jQuery('.introduction').offset().top;
        $("html, body").animate({ scrollTop: loc + 'px' }, 500);
    });
