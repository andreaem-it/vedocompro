/**
 * Created by andreaem on 01/10/17.
 */
if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    $('#search-icon').switchClass("mx-auto","search-icon-mobile");
    $("#nav-search-id").click(function(e) {
        e.preventDefault();
        $(".home-search-box").slideToggle(500);
        $(".container-fluid").toggleClass("margin-top-400",500);
    });
    $("#notification-menu").addClass("notification-closed").click(function() {
        var nmenu = $("#notification-menu");
        nmenu.toggleClass("notification-active");
        nmenu.toggleClass("notification-closed");
    });
    $(".home-search-box").hide();
    $("#nav-search-id").find('i').css("margin-top",'30%');
    $("#nav-icon").click(function() {
        $(".container-fluid").toggleClass("margin-top-300",300);
    })
    $('.pace-progress').css('height','50px');
    
} else {
    alert('desktop');
    $(".home-search-box").hide();
    $("#nav-search-id").click(function (event) {
        event.preventDefault();
        $(".home-search-box").slideToggle(500);
        $(".container-fluid").toggleClass("margin-top-200", 500);
    })
    $('.pace-progress').css('height','86px');
};
function init() {
    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {} else {
        window.addEventListener('scroll', function (e) {
            var distanceY = window.pageYOffset || document.documentElement.scrollTop,
                shrinkOn = 50,
                header = document.querySelector("header");
            if (distanceY > shrinkOn) {
                $('.home-search-box').css('margin-top', '48px');
                $('.navbar').addClass('navbar-collapsed');
                $('.navbar-brand').addClass('navbar-brand-collapsed');
                $('#logo').switchClass('logo-large', 'logo-small', 0)
            } else {
                $('.home-search-box').css('margin-top', '85px');
                $('.navbar').removeClass('navbar-collapsed');
                $('.navbar-brand').removeClass('navbar-brand-collapsed');
                $('#logo').switchClass('logo-small', 'logo-large', 0)
            }
        });
    }
}
window.onload = init();