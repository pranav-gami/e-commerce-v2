
/* ========================================== Start Of Menu Active Class ========================================== */
jQuery("ul li a").filter(function(){
  return this.href == location.href.replace(/#.*/, "");
}).closest("li").addClass("active");
/* ========================================== End Of Menu Active Class ========================================== */


/* ========================================== Start Of Toggle Javascript  ========================================== */
jQuery('.toggle').click(function(e){
    e.stopPropagation();
     jQuery('.toggle-box').toggleClass('toggle-open');
});

jQuery('body,html').click(function(e){
       jQuery('.toggle-box').removeClass('toggle-open');
});
/* ========================================== End Of Toggle Javascript ========================================== */


/* ========================================== Start Of Drop Down Menu Javascript  ========================================== */
  jQuery(function(){
    var children=jQuery('.header-menu li a').filter(function(){return jQuery(this).nextAll().length>0})
    jQuery('<i class="bi bi-chevron-down toggle-link" aria-hidden="true"></i>').insertAfter(children)
    jQuery('.header-menu .toggle-link').click(function (e) {
      jQuery(this).next().toggleClass('active');
        return false;
    });
     jQuery('.header-menu .toggle-link').click(function (e) {
      jQuery(this).parent().toggleClass('active-menu');
        return false;
    });
  })
/* ========================================== End Of Drop Down Menu Javascript ========================================== */


/* ========================================== Start Of Slick Slider Javascript  ========================================== */
jQuery('.screenshot-slider').slick({
    infinite: true,
    arrows: false,
    dots: true,
    centerMode: true,
    centerPadding: '0px',
    slidesToShow: 5,
    slidesToScroll: 5,
    responsive: [{
            breakpoint: 992,
            settings: {
                slidesToShow: 3,
                slidesToScroll: 1,

            }
        },
        {
            breakpoint: 767,
            settings: {
                arrows: false,
                dots: true,
                centerPadding: '18%',
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }
    ]
});


jQuery('.mobile-slider').slick({
    infinite: true,
    arrows: false,
    dots: true,
    slidesToShow: 2,
    mobileFirst: true, 
    responsive: [
       {
          breakpoint: 767,
          settings: "unslick"
       }
    ]
});

/* ========================================== End Of Slick Slider Javascript ========================================== */



/* ========================================== Start Of Preloader Loader Javascript  ========================================== */
jQuery(window).on('load', function () {
    jQuery('#status').fadeOut();
    jQuery('#preloader').delay(350).fadeOut('slow');
    jQuery('body').delay(350).css({
        'overflow': 'visible'
    });
})
/* ========================================== End Of Preloader Loader Javascript ========================================== */


/* ========================================== Start Of Header Fixed Javascript ========================================== */
jQuery(window).scroll(function () {
    if (jQuery(window).scrollTop() >= 100) {
        jQuery('header').addClass('fixed-header');

    } else {
        jQuery('header').removeClass('fixed-header');

    }
});
/* ========================================== End Of Header Fixed Javascript ========================================== */


/* ========================================== Start Of Back To Top Javascript ========================================== */
jQuery(document).ready(function(){ 
    jQuery(window).scroll(function(){ 
        if (jQuery(this).scrollTop() > 800) { 
            jQuery('.back-to-top a').fadeIn(); 
        } else { 
            jQuery('.back-to-top a').fadeOut(); 
        } 
    }); 
    jQuery('.back-to-top a').click(function(){ 
       jQuery("html, body").animate({ scrollTop: 0 }, 600); 
        return false; 
    }); 
});
/* ========================================== End Of Back To Top Javascript ========================================== */




/* ========================================== Start Of Set Background Image Javascript  ========================================== */
function setbg(){
  jQuery(".bgset").each(function(){
    var theBg = jQuery(this).find(".bgimgset").attr("src"); 
    jQuery(this).css('background-image', 'url(' + theBg + ')');
  });
}
setbg();
/* ========================================== End Of Set Background Image Javascript ========================================== */



/* ========================================== Start Of Lightbox Simple Javascript  ========================================== */
jQuery('.lightboxvideolink').simpleLightbox();
/* ========================================== End Of Lightbox Simple Javascript ========================================== */



/* ========================================== Start Of Wow Javascript  ========================================== */
new WOW().init();
/* ========================================== End Of Wow Javascript ========================================== */



/* ========================================== Start Of Match Height Javascript  ========================================== */
function MatchHeight() {
  jQuery('.match')
    .matchHeight({})
  ;
}
jQuery(document).ready(function() {
  MatchHeight(); 
});
/* ========================================== End Of Match Height Javascript ========================================== */




/* ========================================== Start Of Smooth Scroll Javascript  ========================================== */
  jQuery('.smooth-scroll a').click(function() 
  {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') 
        || location.hostname == this.hostname) 
    {
      
      var target = jQuery(this.hash),
      headerHeight = jQuery("header").height() + 5; // Get fixed header height
            
      target = target.length ? target : jQuery('[name=' + this.hash.slice(1) +']');
              
      if (target.length) 
      {
        jQuery('html,body').animate({
          scrollTop: target.offset().top - headerHeight
        }, 500);
        return false;
      }
    }
  });
/* ========================================== End Of Smooth Scroll Javascript ========================================== */
