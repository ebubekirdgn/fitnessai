(function ($) {
    "use strict";

    // Tabs Initialization
    $(function () {
        $("#tabs").tabs();
    });

    // Header Scroll Background Toggle
    $(window).scroll(function () {
        var scroll = $(window).scrollTop();
        var box = $('.header-text').height();
        var header = $('header').height();

        if (scroll >= box - header) {
            $("header").addClass("background-header");
        } else {
            $("header").removeClass("background-header");
        }
    });

    // Schedule Filter
    $('.schedule-filter li').on('click', function () {
        var tsfilter = $(this).data('tsfilter');
        $('.schedule-filter li').removeClass('active');
        $(this).addClass('active');
        if (tsfilter == 'all') {
            $('.schedule-table').removeClass('filtering');
            $('.ts-item').removeClass('show');
        } else {
            $('.schedule-table').addClass('filtering');
        }
        $('.ts-item').each(function () {
            $(this).removeClass('show');
            if ($(this).data('tsmeta') == tsfilter) {
                $(this).addClass('show');
            }
        });
    });

    // Mobile Menu Fix
    function mobileNav() {
        var width = $(window).width();
        $('.submenu').on('click', function () {
            if (width < 767) {
                $('.submenu ul').removeClass('active');
                $(this).find('ul').toggleClass('active');
            }
        });
    }

    mobileNav();

    // Scroll Animation Initialization
    window.sr = new scrollReveal();

    // Menu Dropdown Toggle
    if ($('.menu-trigger').length) {
        $(".menu-trigger").on('click', function () {
            $(this).toggleClass('active');
            $('.header-area .nav').slideToggle(200);
        });
    }

    // Smooth Scroll
    $(document).ready(function () {
        $(document).on("scroll", onScroll);

        $('.scroll-to-section a[href^="#"]').on('click', function (e) {
            e.preventDefault();
            $(document).off("scroll");

            $('a').each(function () {
                $(this).removeClass('active');
            });
            $(this).addClass('active');

            var target = $(this.hash); // Hedef eleman
            if (target.length) { // Hedef mevcutsa
                $('html, body').stop().animate({
                    scrollTop: (target.offset().top) + 1
                }, 500, 'swing', function () {
                    window.location.hash = target.selector;
                    $(document).on("scroll", onScroll);
                });
            } else {
                console.warn('Hedef öğe bulunamadı:', this.hash);
            }
        });
    });

    function onScroll(event) {
        var scrollPos = $(document).scrollTop();
        $('.nav a').each(function () {
            var currLink = $(this);
            var hrefValue = currLink.attr("href");
    
            // Geçerli bir CSS seçicisi olup olmadığını kontrol et
            if (hrefValue && hrefValue.startsWith("#")) { // Sadece ID seçicilerle çalış
                var refElement = $(hrefValue);
                if (refElement.length && refElement.position()) { // Hedef eleman mevcutsa
                    if (refElement.position().top <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
                        $('.nav ul li a').removeClass("active");
                        currLink.addClass("active");
                    } else {
                        currLink.removeClass("active");
                    }
                }
            }
        });
    }
    

    // Page Loading Animation
    $(window).on('load', function () {
        $('#js-preloader').addClass('loaded');
    });

    // Window Resize Mobile Menu Fix
    $(window).on('resize', function () {
        mobileNav();
    });
})(window.jQuery);
