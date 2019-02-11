/**
 * Created by andreaem on 17/04/17.
 */
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})
$('#video-modal').on('hidden.bs.modal', function (e) {
    $('#video-modal').pause()
})
$('.video-carousel').carousel('pause')
$(function(){
    var $refreshButton = $('#refresh');
    var $results = $('#css_result');

    function refresh(){
        var css = $('style.cp-pen-styles').text();
        $results.html(css);
    }

    refresh();
    $refreshButton.click(refresh);

    // Select all the contents when clicked
    $results.click(function(){
        $(this).select();
    });
});
// Javascript to enable link to tab
var url = document.location.toString();
if (url.match('#')) {
    $('.nav-link a[href="#' + url.split('#')[1] + '-tab"]').addClass('active');
    $('.nav-item a[href="#' + url.split('#')[1] + '-tab"]').tab('show');
} //add a suffix

$('checkAll').button('toggle', function() {
    var checkboxes = $(':checkbox');
    if($(this).is(':checked')) {
        checkboxes.prop('checked', true);
    } else {
        checkboxes.prop('checked', false);
    }
});
// Mobile Form Resize
(function($) {
    var $window = $(window),
        $html = $('#search-bar :input');

    $window.resize(function resize(){
        if ($window.width() < 991) {
            return $html.removeClass('form-inline');
        }

        $html.addClass('form-inline');
    }).trigger('resize');
})(jQuery);
//Mobile Hamburger button
$(document).ready(function(){
    $('#nav-icon').click(function(){
        $(this).toggleClass('open');
    });
});
