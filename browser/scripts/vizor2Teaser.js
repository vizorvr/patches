// Scroll down button
jQuery('.hero__scroll-down')
    .on('click', function(event) {
        event.preventDefault();
        var loc = jQuery('.introduction').offset().top;
        $("html, body").animate({ scrollTop: loc + 'px' }, 500);
    });


// Registration form
var registrationForm = document.querySelector('.register__form');
registrationForm.addEventListener('submit', trackAndSubmit);
function trackAndSubmit(event) {
    registrationForm.removeEventListener('submit', trackAndSubmit);
    event.preventDefault();
    E2.track({ event: 'betaWaitingListSignup' })
    setTimeout(function() {
        registrationForm.submit();
    }, 300); // Wait for 300ms before submitting to allow tracking to go through
}
