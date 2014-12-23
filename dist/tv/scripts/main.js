$(function(){

    "use strict";

    var prevImage;
    var imgContainer = $('#imgContainer');

    window.msf.local(function(err, service){

        var channel = service.channel('com.samsung.multiscreen.photoshare');

        channel.connect({name: 'TV'}, function (err) {
            if(err) return console.error(err);
        });

        channel.on('showPhoto',function(msg, from, payload){
            showPhoto(payload);
        });

    });

    function showPhoto(abPhoto){

        var photoBlob = new Blob([abPhoto]);
        var URL = window.URL || window.webkitURL;
        var url = URL.createObjectURL(photoBlob);

        var img = $('<img>');
        img.attr('src', url);
        img.one('load',function(){

            imgContainer.removeClass('waiting');

            var newImg = $(this);
            if(prevImage){
                prevImage.addClass("fadeOut");
                prevImage.one('webkitTransitionEnd', function() {
                    prevImage.remove();
                    newImg.addClass("fadeIn");
                    prevImage = newImg;
                });
            }else{
                newImg.addClass("fadeIn");
                prevImage = newImg;
            }
        });
        img.appendTo(imgContainer);
    }

});





