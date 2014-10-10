$(function(){

    var prevImage;
    var imgContainer = $('#imgContainer');

    var msf = $.msf({
        appId     : window.location.href,
        channelId : 'photoshare'
    });

    msf.on('connect', function(evt, data){
        console.info('connected!');
    });

    msf.on('error', function(error){
        console.error(error);
    });

    msf.on('showPhoto',function(evt, msg, payload){
        showPhoto(payload);
    });

    msf.connect();


    function showPhoto(abPhoto){

        var photoBlob = new Blob([abPhoto]);
        var URL = window.URL || window.webkitURL;
        var url = URL.createObjectURL(photoBlob);

        var img = $('<img>');
        img.attr('src', url);
        img.one('load',function(){
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



